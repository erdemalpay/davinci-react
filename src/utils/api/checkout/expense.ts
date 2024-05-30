import { CheckoutExpense } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Checkout}/expense`;
export function useCheckoutExpenseMutations() {
  const {
    deleteItem: deleteCheckoutExpense,
    updateItem: updateCheckoutExpense,
    createItem: createCheckoutExpense,
  } = useMutationApi<CheckoutExpense>({
    baseQuery: baseUrl,
  });
  return {
    deleteCheckoutExpense,
    updateCheckoutExpense,
    createCheckoutExpense,
  };
}

export function useGetCheckoutExpenses() {
  return useGetList<CheckoutExpense>(baseUrl);
}
