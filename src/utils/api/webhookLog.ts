import { useQuery } from "@tanstack/react-query";
import { get } from ".";
import { FormElementsState, WebhookLog } from "../../types";
import { Paths } from "./factory";

const baseUrl = `${Paths.WebhookLog}`;

export interface WebhookLogPayload {
  logs: WebhookLog[];
  total: number;
  page: number;
  limit: number;
}

export function useGetQueryWebhookLogs(
  page: number,
  limit: number,
  filters: FormElementsState
) {
  const parts = [
    `page=${page}`,
    `limit=${limit}`,
    filters.source && `source=${filters.source}`,
    filters.status && `status=${filters.status}`,
    filters.endpoint && `endpoint=${filters.endpoint}`,
    filters.startDate && `startDate=${filters.startDate}`,
    filters.endDate && `endDate=${filters.endDate}`,
  ];

  const queryString = parts.filter(Boolean).join("&");
  const url = `${baseUrl}/query?${queryString}`;
  const queryKey = [url, page, limit, filters];

  const { data, isLoading, error, isFetching } = useQuery<WebhookLogPayload>({
    queryKey,
    queryFn: () => get<WebhookLogPayload>({ path: url }),
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return {
    data,
    isLoading,
    error,
    isFetching,
  };
}
