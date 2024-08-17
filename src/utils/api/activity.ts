import { useQuery } from "@tanstack/react-query";
import { Activity } from "../../types";
import { get } from "./index";

export interface ActivityFilter {
  user?: string;
  date?: string;
  page: number;
  type?: string;
  limit: number;
  sort?: string;
  asc?: number;
}
export interface ActivityQueryResult {
  totalCount: number;
  items: Activity[];
}

const BASE_URL_ACTIVITIES = "/activity";

export function useGetActivities(filter: ActivityFilter) {
  const { user, date, limit, page, sort, asc, type } = filter;
  let query = `${BASE_URL_ACTIVITIES}/query?page=${page}&limit=${limit}`;
  if (date) {
    query += `&date=${date}`;
  }
  if (type) {
    query += `&type=${type}`;
  }
  if (user) {
    query += `&user=${user}`;
  }

  if (sort) {
    query += `&sort=${sort}`;
  }
  if (asc) {
    query += `&asc=${asc}`;
  }
  const queryKey = [
    BASE_URL_ACTIVITIES,
    "query",
    page,
    limit,
    user,
    type,
    date,
    sort,
    asc,
  ];
  const { isLoading, error, data, isFetching } = useQuery(queryKey, () =>
    get<ActivityQueryResult>({ path: query })
  );
  return {
    isLoading,
    error,
    data,
    isFetching,
  };
}
