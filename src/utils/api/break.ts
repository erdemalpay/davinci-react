import { Break, FormElementsState } from "../../types";
import { Paths, useGet, useMutationApi } from "./factory";

const breakBaseUrl = `${Paths.Breaks}`;

export interface BreakPayload {
  data: Break[];
  totalNumber: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface BreakQueryParams {
  user?: string;
  location?: number;
  date?: string;
  after?: string;
  before?: string;
  page?: number;
  limit?: number;
  sort?: string;
  asc?: number;
}

// Get all breaks with filters
export const useGetBreaks = (
  page = 1,
  limit = 10,
  filters?: BreakQueryParams & FormElementsState
) => {
  const parts = [
    `page=${page}`,
    `limit=${limit}`,
    filters?.user && `user=${filters.user}`,
    filters?.location && `location=${filters.location}`,
    filters?.date && `date=${filters.date}`,
    filters?.after && `after=${filters.after}`,
    filters?.before && `before=${filters.before}`,
    filters?.sort && `sort=${filters.sort}`,
    filters?.asc !== undefined && `asc=${filters.asc}`,
  ];
  const queryString = parts.filter(Boolean).join("&");
  return useGet<BreakPayload>(
    `${breakBaseUrl}?${queryString}`,
    [breakBaseUrl, page, limit, filters],
    true
  );
};

// Get break by ID
export const useGetBreak = (id: string) => {
  return useGet<Break>(`${breakBaseUrl}/${id}`, [breakBaseUrl, id], true);
};

// Get breaks by location (active breaks only)
export const useGetBreaksByLocation = (location: number) => {
  return useGet<Break[]>(
    `${breakBaseUrl}/location/${location}`,
    [breakBaseUrl, "location", location],
    true
  );
};

// Get breaks by date (active breaks only)
export const useGetBreaksByDate = (date: string) => {
  return useGet<Break[]>(
    `${breakBaseUrl}/date/${date}`,
    [breakBaseUrl, "date", date],
    true
  );
};

// Break mutations
export const useBreakMutations = () => {
  const { createItem, updateItem, deleteItem } = useMutationApi<Break>({
    baseQuery: breakBaseUrl,
    queryKey: [breakBaseUrl],
  });

  return {
    createBreak: createItem,
    updateBreak: updateItem,
    deleteBreak: deleteItem,
  };
};
