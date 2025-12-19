import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { post } from ".";
import { FormElementsState, Notification } from "../../types";
import { Paths, useGet, useGetList, useMutationApi } from "./factory";

const baseUrl = `${Paths.Notification}`;

export interface NotificationsPayload {
  data: Notification[];
  totalNumber: number;
  totalPages: number;
  page: number;
  limit: number;
}

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
export function useGetQueryNotifications(
  page: number,
  limit: number,
  filters: FormElementsState
) {
  const parts = [
    `page=${page}`,
    `limit=${limit}`,
    filters.after && `after=${filters.after}`,
    filters.before && `before=${filters.before}`,
    filters.type && `type=${filters.type}`,
    filters.event && `event=${filters.event}`,
    filters.sort && `sort=${filters.sort}`,
    filters.asc !== undefined && `asc=${filters.asc}`,
    filters.search && `search=${filters.search.trim()}`,
  ];

  const queryString = parts.filter(Boolean).join("&");
  const url = `${baseUrl}/query?${queryString}`;

  return useGet<NotificationsPayload>(url, [url, page, limit, filters], true);
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
  type,
  event,
}: {
  after: string;
  before?: string;
  type?: string;
  event?: string;
}) {
  let url = `${baseUrl}/all?after=${after}`;
  if (before) url += `&before=${before}`;
  if (type) url += `&type=${type}`;
  if (event) url += `&event=${event}`;

  return useGetList<Notification>(url, [
    `${Paths.Notification}/all`,
    after,
    before,
    type,
    event ?? null,
  ]);
}

export function markAsRead(ids: number[]) {
  return post({
    path: `${Paths.Notification}/mark-as-read`,
    payload: { ids },
  });
}

export function useMarkAsReadMutation() {
  const notificationBaseUrl = `${Paths.Notification}/new`;
  const queryKey = [notificationBaseUrl];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: number[]) => {
      // Call API to mark notification as read
      await markAsRead(ids);
      return ids; // Return the id so `onSuccess` knows which notification was read
    },
    onMutate: async (ids: number[]) => {
        await queryClient.cancelQueries({ queryKey }); // Cancel outgoing queries

        // Get the current notifications from cache
        const previousNotifications =
          queryClient.getQueryData<Notification[]>(queryKey) || [];

        if (ids.includes(-1)) {
          // mark all as read
          queryClient.setQueryData<Notification[]>(queryKey, []);
          return { previousNotifications };
        }

        // Optimistically remove the read notification
        queryClient.setQueryData<Notification[]>(
          queryKey,
          previousNotifications.filter(
            (notification) => !ids.includes(notification._id)
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
        queryClient.invalidateQueries({ queryKey });
      },
  });
}
