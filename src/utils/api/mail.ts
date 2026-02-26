import { FormElementsState } from "../../types";
import { Paths, useGet, useGetList, useMutationApi } from "./factory";

export enum MailType {
  BACK_IN_STOCK = "back_in_stock",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  UNSUBSCRIBED = "unsubscribed",
  BOUNCED = "bounced",
  COMPLAINED = "complained",
}

export type MailSubscription = {
  _id: number;
  email: string;
  name: string;
  subscribedTypes: MailType[];
  status: SubscriptionStatus;
  userId: string;
  unsubscribeToken: string;
  subscribedAt: Date;
  unsubscribedAt: Date;
  metadata: Record<string, any>;
  locale: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface MailSubscriptionsPayload {
  data: MailSubscription[];
  totalNumber: number;
  totalPages: number;
  page: number;
  limit: number;
}

const baseUrl = `${Paths.Mail}/subscriptions`;

export function useGetMailSubscriptions() {
  return useGetList<MailSubscription>(baseUrl);
}

export function useGetQueryMailSubscriptions(
  page: number,
  limit: number,
  filters: FormElementsState
) {
  const baseQueryUrl = `${Paths.Mail}/subscriptions`;

  const queryKey = [
    baseQueryUrl,
    {
      page,
      limit,
      status: filters.status ?? null,
      subscribedType: filters.subscribedType ?? null,
      after: filters.after ?? null,
      before: filters.before ?? null,
      sort: filters.sort ?? null,
      asc: filters.asc ?? null,
      search: filters.search ?? null,
    },
  ] as const;

  const parts = [
    `page=${page}`,
    `limit=${limit}`,
    filters.status && `status=${filters.status}`,
    filters.subscribedType && `subscribedType=${filters.subscribedType}`,
    filters.after && `after=${filters.after}`,
    filters.before && `before=${filters.before}`,
    filters.sort && `sort=${filters.sort}`,
    filters.asc !== undefined && `asc=${filters.asc}`,
    filters.search && `search=${filters.search}`,
  ];
  const queryString = parts.filter(Boolean).join("&");
  const url = `${baseQueryUrl}?${queryString}`;

  return useGet<MailSubscriptionsPayload>(url, queryKey, true);
}

export function useMailSubscriptionMutations() {
  const {
    updateItem: updateMailSubscription,
    createItem: createMailSubscription,
    deleteItem: deleteMailSubscription,
  } = useMutationApi<MailSubscription>({
    baseQuery: baseUrl,
  });

  return {
    updateMailSubscription,
    createMailSubscription,
    deleteMailSubscription,
  };
}
