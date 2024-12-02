import { CheckoutControl } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";
import { FormElementsState } from "./../../../types/index";

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

export function useGetCheckoutControls(filterPanelElements: FormElementsState) {
  return useGetList<CheckoutControl>(
    `${baseUrl}?user=${filterPanelElements.user}&location=${filterPanelElements.location}&date=${filterPanelElements.date}`,
    [baseUrl, filterPanelElements],
    true
  );
}
