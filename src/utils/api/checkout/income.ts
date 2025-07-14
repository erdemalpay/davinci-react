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

export function useGetQueryIncomes(filter: {
  after?: string;
  before?: string;
  date?: string;
}) {
  const url = `${Paths.Checkout}/income/query?after=${
    filter.after || ""
  }&before=${filter.before || ""}&date=${filter.date || ""}`;
  return useGetList<CheckoutIncome>(
    `${url}`,
    [url, filter.after, filter.before, filter.date],
    true
  );
}
