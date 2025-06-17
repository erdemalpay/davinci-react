import { Activity, FormElementsState } from "../../types";
import { useGet } from "./factory";

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
export interface ActivityPayload {
  data: Activity[];
  totalNumber: number;
  totalPages: number;
  page: number;
  limit: number;
}
const BASE_URL_ACTIVITIES = "/activity";

export function useGetActivities(filters: FormElementsState) {
  const parts = [
    filters.user && `user=${filters.user}`,
    filters.type && `type=${filters.type}`,
    filters.date && `date=${filters.date}`,
    filters.after && `after=${filters.after}`,
    filters.before && `before=${filters.before}`,
  ];
  const queryString = parts.filter(Boolean).join("&");
  const url = `${BASE_URL_ACTIVITIES}/query?${queryString}`;
  return useGet<Activity[]>(url, [url, filters], true);
}
