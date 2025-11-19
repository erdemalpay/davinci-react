import { Consumer, ConsumerStatus, FormElementsState } from "../../types";
import { Paths, useGet, useGetList, useMutationApi } from "./factory";

const consumerBaseUrl = `${Paths.Consumers}`;

export interface ConsumerPayload {
  data: Consumer[];
  totalNumber: number;
  totalPages: number;
  page: number;
  limit: number;
}

// Get all consumers with filters
export const useGetConsumers = (
  page: number,
  limit: number,
  status?: ConsumerStatus,
  filters?: FormElementsState
) => {
  const trimmedSearch = filters?.search?.trim();
  const parts = [
    `page=${page}`,
    `limit=${limit}`,
    trimmedSearch && `search=${trimmedSearch}`,
    status && `status=${status}`,
    filters?.sort && `sort=${filters.sort}`,
    filters?.asc !== undefined && `asc=${filters.asc}`,
  ];
  const queryString = parts.filter(Boolean).join("&");
  return useGet<ConsumerPayload>(
    `${consumerBaseUrl}?${queryString}`,
    [consumerBaseUrl, page, limit, status, filters],
    true
  );
};

// find All with full names
export const useGetConsumersWithFullNames = () => {
  return useGetList<Consumer>(`${consumerBaseUrl}/full-names`);
};
// Consumer mutations
export const useConsumerMutations = () => {
  const { createItem, updateItem, deleteItem } = useMutationApi<Consumer>({
    baseQuery: consumerBaseUrl,
    queryKey: [consumerBaseUrl],
  });

  return {
    createConsumer: createItem,
    updateConsumer: updateItem,
    deleteConsumer: deleteItem,
  };
};
