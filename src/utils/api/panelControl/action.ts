import { Paths, useGetList, useMutationApi } from "../factory";
import { Action } from "./../../../types/index";

const baseUrl = `${Paths.PanelControl}/actions`;

export function useActionMutations() {
  const {
    deleteItem: deleteAction,
    updateItem: updateAction,
    createItem: createAction,
  } = useMutationApi<Action>({
    baseQuery: baseUrl,
  });
  return {
    deleteAction,
    updateAction,
    createAction,
  };
}
export function useGetActions() {
  return useGetList<Action>(baseUrl);
}
