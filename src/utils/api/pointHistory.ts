import { FormElementsState, PointHistory } from "../../types";
import { Paths, useGet } from "./factory";

export interface PointHistoryPayload {
  data: PointHistory[];
  totalNumber: number;
  totalPages: number;
  page: number;
  limit: number;
}

const baseUrl = `${Paths.Point}/history/query`;

export function useGetPointHistories(
  page: number,
  limit: number,
  filters: FormElementsState
) {
  const parts = [
    `page=${page}`,
    `limit=${limit}`,
    filters.pointUser && `pointUser=${filters.pointUser}`,
    filters.pointConsumer && `pointConsumer=${filters.pointConsumer}`,
    filters.status && `status=${filters.status}`,
    filters.before && `before=${filters.before}`,
    filters.after && `after=${filters.after}`,
    filters.sort && `sort=${filters.sort}`,
    filters.asc !== undefined && `asc=${filters.asc}`,
  ];
  const queryString = parts.filter(Boolean).join("&");
  return useGet<PointHistoryPayload>(
    `${baseUrl}?${queryString}`,
    [baseUrl, page, limit, filters],
    true
  );
}
