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
