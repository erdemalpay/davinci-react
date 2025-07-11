import { CheckoutCashout } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";
export class CashoutQueryFilter {
  after?: string;
  before?: string;
  date?: string;
}
const baseUrl = `${Paths.Checkout}/cashout`;
export function useCheckoutCashoutMutations() {
  const {
    deleteItem: deleteCheckoutCashout,
    updateItem: updateCheckoutCashout,
    createItem: createCheckoutCashout,
  } = useMutationApi<CheckoutCashout>({
    baseQuery: baseUrl,
  });
  return {
    deleteCheckoutCashout,
    updateCheckoutCashout,
    createCheckoutCashout,
  };
}

export function useGetCheckoutCashouts() {
  return useGetList<CheckoutCashout>(baseUrl);
}
export function useGetQueryCashouts(filter: CashoutQueryFilter) {
  const url = `${Paths.Checkout}/cashout/query?after=${
    filter.after || ""
  }&before=${filter.before || ""}&date=${filter.date || ""}`;
  return useGetList<CheckoutCashout>(
    `${url}`,
    [url, filter.after, filter.before, filter.date],
    true
  );
}
