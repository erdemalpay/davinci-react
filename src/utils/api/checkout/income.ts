import { CheckoutIncome } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Checkout}/income`;
export function useCheckoutIncomeMutations() {
  const {
    deleteItem: deleteCheckoutIncome,
    updateItem: updateCheckoutIncome,
    createItem: createCheckoutIncome,
  } = useMutationApi<CheckoutIncome>({
    baseQuery: baseUrl,
  });
  return { deleteCheckoutIncome, updateCheckoutIncome, createCheckoutIncome };
}

export function useGetCheckoutIncomes() {
  return useGetList<CheckoutIncome>(baseUrl);
}
