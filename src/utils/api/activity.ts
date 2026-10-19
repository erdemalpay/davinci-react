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

export function useGetActivities(
  page: number,
  limit: number,
  filters: FormElementsState
) {
  const parts = [
    `page=${page}`,
    `limit=${limit}`,
    filters.user && `user=${filters.user}`,
    filters.type && `type=${filters.type}`,
    filters.date && `date=${filters.date}`,
    filters.after && `after=${filters.after}`,
    filters.before && `before=${filters.before}`,
    filters.sort && `sort=${filters.sort}`,
    filters.asc !== undefined && `asc=${filters.asc}`,
    filters.search && `search=${filters.search.trim()}`,
  ];
  const queryString = parts.filter(Boolean).join("&");
  const url = `${BASE_URL_ACTIVITIES}/query?${queryString}`;
  return useGet<ActivityPayload>(url, [url, page, limit, filters], true);
}

// One time someone added the game to the games they know, or removed it.
export type GameLearningRecord = {
  user: string;
  learned: boolean;
  date: string;
};

export function useGetGameLearningHistory(gameId: number) {
  const url = `${BASE_URL_ACTIVITIES}/game-learning/${gameId}`;
  return useGet<GameLearningRecord[]>(url, [url], true, {
    enabled: !!gameId,
  });
}
