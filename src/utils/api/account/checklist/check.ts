import { Paths, useGetList, useMutationApi } from "../../factory";
import { CheckType } from "./../../../../types/index";

const baseUrl = `${Paths.Checklist}/check`;
export function useCheckMutations() {
  const {
    deleteItem: deleteCheck,
    updateItem: updateCheck,
    createItem: createCheck,
  } = useMutationApi<CheckType>({
    baseQuery: baseUrl,
  });

  return {
    deleteCheck,
    updateCheck,
    createCheck,
  };
}

export function useGetChecks() {
  return useGetList<CheckType>(baseUrl);
}
