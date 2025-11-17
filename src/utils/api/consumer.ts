import { Consumer, ConsumerStatus, FormElementsState } from "../../types";
import { Paths, useGet, useMutationApi } from "./factory";

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
  search?: string,
  status?: ConsumerStatus,
  filters?: FormElementsState
) => {
  const parts = [
    `page=${page}`,
    `limit=${limit}`,
    search && `search=${search}`,
    status && `status=${status}`,
    filters?.sort && `sort=${filters.sort}`,
    filters?.asc !== undefined && `asc=${filters.asc}`,
  ];
  const queryString = parts.filter(Boolean).join("&");

  return useGet<ConsumerPayload>(
    `${consumerBaseUrl}?${queryString}`,
    [consumerBaseUrl, page, limit, search, status, filters],
    true
  );
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
