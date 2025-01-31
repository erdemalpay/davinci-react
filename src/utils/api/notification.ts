import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { post } from ".";
import { Notification } from "../../types";
import { Paths, useGetList, useMutationApi } from "./factory";

const baseUrl = `${Paths.Notification}`;

export function useNotificationMutations() {
  const { createItem: createNotification } = useMutationApi<Notification>({
    baseQuery: Paths.Notification,
  });

  return { createNotification };
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
    payload: id,
  });
}

export function useMarkAsReadMutation() {
  const notificationBaseUrl = `${Paths.Notification}/new`;
  const queryKey = [notificationBaseUrl];
  const queryClient = useQueryClient();
  return useMutation(markAsRead, {
    onMutate: async (id: number) => {
      // Cancel any outgoing refetches to prevent overwriting the optimistic update
      await queryClient.cancelQueries(queryKey);

      // Snapshot the previous value
      const previousNotifications =
        queryClient.getQueryData<Notification[]>(queryKey) || [];

      // Create a deep copy of the notifications to avoid mutating the original data
      const updatedNotifications: Notification[] = JSON.parse(
        JSON.stringify(previousNotifications)
      );

      // Filter out the old notification and the new notification (which will be re-added with updated values)
      const remainingNotifications = updatedNotifications.filter(
        (notification) => notification._id !== id
      );

      // Update the notifications list with the new state of the transferred notification
      queryClient.setQueryData<Notification[]>(
        queryKey,
        remainingNotifications
      );

      // Return the previous state in case of rollback
      return { previousNotifications };
    },
    onError: (_err: any, _newNotification, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData<Notification[]>(
          queryKey,
          context.previousNotifications
        );
      }

      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
    onSettled: () => {
      queryClient.invalidateQueries(queryKey);
    },
  });
}
