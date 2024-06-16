import { PanelControlCheckoutCash } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.PanelControl}/checkout-cash`;
export function usePanelControlCheckoutCashMutations() {
  const {
    deleteItem: deletePanelControlCheckoutCash,
    updateItem: updatePanelControlCheckoutCash,
    createItem: createPanelControlCheckoutCash,
  } = useMutationApi<PanelControlCheckoutCash>({
    baseQuery: baseUrl,
  });
  return {
    deletePanelControlCheckoutCash,
    updatePanelControlCheckoutCash,
    createPanelControlCheckoutCash,
  };
}

export function useGetPanelControlCheckoutCashs() {
  return useGetList<PanelControlCheckoutCash>(baseUrl);
}
