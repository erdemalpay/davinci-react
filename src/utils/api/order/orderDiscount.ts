import { OrderDiscount } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Order}/discount`;
export function useOrderDiscountMutations() {
  const {
    deleteItem: deleteOrderDiscount,
    updateItem: updateOrderDiscount,
    createItem: createOrderDiscount,
  } = useMutationApi<OrderDiscount>({
    baseQuery: baseUrl,
  });
  return {
    deleteOrderDiscount,
    updateOrderDiscount,
    createOrderDiscount,
  };
}

export function useGetOrderDiscounts() {
  return useGetList<OrderDiscount>(baseUrl);
}
