import { useQuery } from "@tanstack/react-query";
import { endOfDay, format } from "date-fns";
import { get } from ".";
import { ConcurrencyLog, FormElementsState } from "../../types";
import { Paths } from "./factory";

const baseUrl = `${Paths.ConcurrencyLog}`;
export interface ConcurrencyLogPayload {
  logs: ConcurrencyLog[];
  total: number;
  page: number;
  limit: number;
}

export function useGetConcurrencyLogs(
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
    filters.endpoint && `endpoint=${filters.endpoint}`,
    filters.startDate && `startDate=${filters.startDate}`,
    filters.endDate && `endDate=${formatEndDate(filters.endDate)}`,
  ];

  const queryString = parts.filter(Boolean).join("&");
  const url = `${baseUrl}/query?${queryString}`;
  const queryKey = [url, page, limit, filters];

  const { data, isLoading, error, isFetching } =
    useQuery<ConcurrencyLogPayload>({
      queryKey,
      queryFn: () => get<ConcurrencyLogPayload>({ path: url }),
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
