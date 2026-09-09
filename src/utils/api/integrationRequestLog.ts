import { useQuery } from "@tanstack/react-query";
import { endOfDay, format } from "date-fns";
import { get } from ".";
import { FormElementsState, IntegrationRequestLog } from "../../types";
import { Paths } from "./factory";

const baseUrl = `${Paths.IntegrationRequestLog}`;

export interface IntegrationRequestLogPayload {
  logs: IntegrationRequestLog[];
  total: number;
  page: number;
  limit: number;
}

export function useGetIntegrationRequestLogs(
  page: number,
  limit: number,
  filters: FormElementsState
) {
  const formatEndDate = (dateString: string | undefined) => {
    if (!dateString) return undefined;
    try {
      const date = new Date(dateString);
      const endOfDayDate = endOfDay(date);
      return format(endOfDayDate, "yyyy-MM-dd'T'HH:mm:ss");
    } catch (e) {
      return dateString;
    }
  };

  const parts = [
    `page=${page}`,
    `limit=${limit}`,
    filters.status && `status=${filters.status}`,
    filters.startDate && `startDate=${filters.startDate}`,
    filters.endDate && `endDate=${formatEndDate(filters.endDate)}`,
  ];

  const queryString = parts.filter(Boolean).join("&");
  const url = `${baseUrl}/query?${queryString}`;
  const queryKey = [url, page, limit, filters];

  const { data, isLoading, error, isFetching } =
    useQuery<IntegrationRequestLogPayload>({
      queryKey,
      queryFn: () => get<IntegrationRequestLogPayload>({ path: url }),
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
