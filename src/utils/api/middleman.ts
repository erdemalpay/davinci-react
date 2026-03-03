import { Middleman } from "../../types";
import { Paths, useGet, useMutationApi } from "./factory";

const middlemanBaseUrl = `${Paths.Middlemen}`;

export interface MiddlemanAll extends Middleman {
  duration: number;
}

export interface MiddlemanPayload {
  data: MiddlemanAll[];
  totalNumber: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface MiddlemanQueryParams {
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

export const useGetMiddlemen = (
  page = 1,
  limit = 10,
  filters?: MiddlemanQueryParams
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
  return useGet<MiddlemanPayload>(
    `${middlemanBaseUrl}?${queryString}`,
    [middlemanBaseUrl, page, limit, filters],
    true
  );
};

export const useGetMiddlemanByLocation = (location: number) => {
  return useGet<Middleman[]>(
    `${middlemanBaseUrl}/location/${location}`,
    [middlemanBaseUrl, "location", location],
    true
  );
};

export const useGetMiddlemanByDate = (date: string) => {
  return useGet<Middleman[]>(
    `${middlemanBaseUrl}/date/${date}`,
    [middlemanBaseUrl, "date", date],
    true
  );
};

export const useMiddlemanMutations = () => {
  const { createItem, updateItem, deleteItem } = useMutationApi<Middleman>({
    baseQuery: middlemanBaseUrl,
    queryKey: [middlemanBaseUrl],
  });

  return {
    createMiddleman: createItem,
    updateMiddleman: updateItem,
    deleteMiddleman: deleteItem,
  };
};