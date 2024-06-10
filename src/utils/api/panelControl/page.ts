import { PanelControlPage } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.PanelControl}/pages`;
export function usePanelControlPageMutations() {
  const {
    deleteItem: deletePanelControlPage,
    updateItem: updatePanelControlPage,
    createItem: createPanelControlPage,
  } = useMutationApi<PanelControlPage>({
    baseQuery: baseUrl,
  });
  return {
    deletePanelControlPage,
    updatePanelControlPage,
    createPanelControlPage,
  };
}

export function useGetPanelControlPages() {
  return useGetList<PanelControlPage>(baseUrl);
}
