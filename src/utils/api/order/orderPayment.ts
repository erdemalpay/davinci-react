import { OrderPayment } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";
import { useDateContext } from "./../../../context/Date.context";
import { useLocationContext } from "./../../../context/Location.context";

const baseUrl = `${Paths.Order}/payment`;
export function useOrderPaymentMutations() {
  const {
    deleteItem: deleteOrderPayment,
    updateItem: updateOrderPayment,
    createItem: createOrderPayment,
  } = useMutationApi<OrderPayment>({
    baseQuery: baseUrl,
  });
  return {
    deleteOrderPayment,
    updateOrderPayment,
    createOrderPayment,
  };
}

export function useGetOrderPayments() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  return useGetList<OrderPayment>(
    `${baseUrl}/date/?location=${selectedLocationId}&date=${selectedDate}`,
    [`${Paths.Order}/payment`, selectedLocationId, selectedDate]
  );
}
export function useGetAllOrderPayments() {
  return useGetList<OrderPayment>(baseUrl);
}
