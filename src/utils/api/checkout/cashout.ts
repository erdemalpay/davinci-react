import { CheckoutCashout } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

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
