import { FormElementsState, GameplayTime } from "../../types";
import { Paths, useGet, useMutationApi } from "./factory";

const gameplayTimeBaseUrl = `${Paths.GameplayTime}`;

export interface GameplayTimePayload {
  data: GameplayTime[];
  totalNumber: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface GameplayTimeQueryParams {
  user?: string;
  location?: number;
  gameplay?: number;
  date?: string;
  after?: string;
  before?: string;
  page?: number;
  limit?: number;
  sort?: string;
  asc?: number;
}

// Get all gameplay times with filters
export const useGetGameplayTimes = (
  page = 1,
  limit = 10,
  filters?: GameplayTimeQueryParams & FormElementsState
) => {
  const parts = [
    `page=${page}`,
    `limit=${limit}`,
    filters?.user && `user=${filters.user}`,
    filters?.location && `location=${filters.location}`,
    filters?.gameplay && `gameplay=${filters.gameplay}`,
    filters?.date && `date=${filters.date}`,
    filters?.after && `after=${filters.after}`,
    filters?.before && `before=${filters.before}`,
    filters?.sort && `sort=${filters.sort}`,
    filters?.asc !== undefined && `asc=${filters.asc}`,
  ];
  const queryString = parts.filter(Boolean).join("&");
  return useGet<GameplayTimePayload>(
    `${gameplayTimeBaseUrl}?${queryString}`,
    [gameplayTimeBaseUrl, page, limit, filters],
    true
  );
};

// Get gameplay time by ID
export const useGetGameplayTime = (id: string) => {
  return useGet<GameplayTime>(
    `${gameplayTimeBaseUrl}/${id}`,
    [gameplayTimeBaseUrl, id],
    true
  );
};

// Get gameplay times by location
export const useGetGameplayTimesByLocation = (location: number) => {
  return useGet<GameplayTime[]>(
    `${gameplayTimeBaseUrl}/location/${location}`,
    [gameplayTimeBaseUrl, "location", location],
    true
  );
};

// Get gameplay times by date
export const useGetGameplayTimesByDate = (date: string) => {
  return useGet<GameplayTime[]>(
    `${gameplayTimeBaseUrl}/date/${date}`,
    [gameplayTimeBaseUrl, "date", date],
    true
  );
};

// GameplayTime mutations
export const useGameplayTimeMutations = () => {
  const { createItem, updateItem, deleteItem } = useMutationApi<GameplayTime>({
    baseQuery: gameplayTimeBaseUrl,
    queryKey: [gameplayTimeBaseUrl],
  });

  return {
    createGameplayTime: createItem,
    updateGameplayTime: updateItem,
    deleteGameplayTime: deleteItem,
  };
};
