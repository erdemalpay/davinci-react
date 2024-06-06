import { CheckoutControl } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Checkout}/checkout-control`;
export function useCheckoutControlMutations() {
  const {
    deleteItem: deleteCheckoutControl,
    updateItem: updateCheckoutControl,
    createItem: createCheckoutControl,
  } = useMutationApi<CheckoutControl>({
    baseQuery: baseUrl,
  });
  return {
    deleteCheckoutControl,
    updateCheckoutControl,
    createCheckoutControl,
  };
}

export function useGetCheckoutControls() {
  return useGetList<CheckoutControl>(baseUrl);
}
