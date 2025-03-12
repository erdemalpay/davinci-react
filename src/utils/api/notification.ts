import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { post } from ".";
import { Notification } from "../../types";
import { Paths, useGetList, useMutationApi } from "./factory";

const baseUrl = `${Paths.Notification}`;

export function useNotificationMutations() {
  const {
    createItem: createNotification,
    updateItem: updateNotification,
    deleteItem: deleteNotification,
  } = useMutationApi<Notification>({
    baseQuery: Paths.Notification,
  });

  return { createNotification, updateNotification, deleteNotification };
}
export function useGetNotifications({
  after,
  before,
}: {
  after: string;
  before?: string;
}) {
  let url = `${baseUrl}?after=${after}`;
  if (before) url += `&before=${before}`;

  return useGetList<Notification>(url, [baseUrl, after, before ?? null], true);
}

export function useGetUserNewNotifications() {
  return useGetList<Notification>(`${Paths.Notification}/new`, [
    `${Paths.Notification}/new`,
  ]);
}
export function useGetEventNotifications() {
  return useGetList<Notification>(`${Paths.Notification}/event`, [
    `${Paths.Notification}/event`,
  ]);
}

export function useGetUserAllNotifications({
  after,
  before,
}: {
  after: string;
  before?: string;
}) {
  let url = `${baseUrl}/all?after=${after}`;
  if (before) url += `&before=${before}`;
  return useGetList<Notification>(url, [
    `${Paths.Notification}/all`,
    after,
    before ?? null,
  ]);
}

export function markAsRead(id: number) {
  return post({
    path: `${Paths.Notification}/mark-as-read`,
    payload: { id },
  });
}

export function useMarkAsReadMutation() {
  const notificationBaseUrl = `${Paths.Notification}/new`;
  const queryKey = [notificationBaseUrl];
  const queryClient = useQueryClient();

  return useMutation(
    async (id: number) => {
      // Call API to mark notification as read
      await markAsRead(id);
      return id; // Return the id so `onSuccess` knows which notification was read
    },
    {
      onMutate: async (id: number) => {
        await queryClient.cancelQueries(queryKey); // Cancel outgoing queries

        // Get the current notifications from cache
        const previousNotifications =
          queryClient.getQueryData<Notification[]>(queryKey) || [];

        // Optimistically remove the read notification
        queryClient.setQueryData<Notification[]>(
          queryKey,
          previousNotifications.filter(
            (notification) => notification._id !== id
          )
        );

        // Return previous state in case of rollback
        return { previousNotifications };
      },
      onError: (_err: any, _id, context) => {
        // Rollback to previous state in case of an error
        if (context?.previousNotifications) {
          queryClient.setQueryData<Notification[]>(
            queryKey,
            context.previousNotifications
          );
        }

        // Show error message
        const errorMessage =
          _err?.response?.data?.message || "An unexpected error occurred";
        setTimeout(() => toast.error(errorMessage), 200);
      },
      onSuccess: () => {
        // Only refetch when the mutation is successful
        queryClient.invalidateQueries(queryKey);
      },
    }
  );
}
