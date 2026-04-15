import { useQuery } from "@tanstack/react-query";
import { endOfDay, format } from "date-fns";
import { get } from ".";
import { ConcurrencyLog } from "../../types";

const baseUrl = "/concurrency-log";

export interface ConcurrencyLogPayload {
  logs: ConcurrencyLog[];
  total: number;
  page: number;
  limit: number;
}

export function useGetConcurrencyLogEndpoints() {
  return useQuery<string[]>({
    queryKey: [`${baseUrl}/endpoints`],
    queryFn: () => get<string[]>({ path: `${baseUrl}/endpoints` }),
    staleTime: 1000 * 60 * 5,
  });
}

export function useGetConcurrencyLogs(
  page: number,
  limit: number,
  filters: {
    endpoint?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  const formatEndDate = (dateString: string | undefined) => {
    if (!dateString) return undefined;
    try {
      return format(endOfDay(new Date(dateString)), "yyyy-MM-dd'T'HH:mm:ss");
    } catch {
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

  return useQuery<ConcurrencyLogPayload>({
    queryKey: [url, page, limit, filters],
    queryFn: () => get<ConcurrencyLogPayload>({ path: url }),
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
