import { Paths, useGetList, useMutationApi } from "../factory";
import { DisabledCondition } from "./../../../types/index";

const baseUrl = `${Paths.PanelControl}/disabled-conditions`;

export function useDisabledConditionMutations() {
  const {
    deleteItem: deleteDisabledCondition,
    updateItem: updateDisabledCondition,
    createItem: createDisabledCondition,
  } = useMutationApi<DisabledCondition>({
    baseQuery: baseUrl,
  });
  return {
    deleteDisabledCondition,
    updateDisabledCondition,
    createDisabledCondition,
  };
}
export function useGetDisabledConditions() {
  return useGetList<DisabledCondition>(baseUrl);
}
