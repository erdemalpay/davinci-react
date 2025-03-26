import { CafeActivity } from "../../types/index";
import { Paths, useGetList, useMutationApi } from "./factory";

export function useCafeActivityMutations() {
  const {
    deleteItem: deleteCafeActivity,
    updateItem: updateCafeActivity,
    createItem: createCafeActivity,
  } = useMutationApi<CafeActivity>({
    baseQuery: Paths.CafeActivity,
  });

  return { deleteCafeActivity, updateCafeActivity, createCafeActivity };
}

export function useGetCafeActivitys() {
  return useGetList<CafeActivity>(Paths.CafeActivity);
}
