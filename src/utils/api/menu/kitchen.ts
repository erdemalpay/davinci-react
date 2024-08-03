import { Kitchen } from "../../../types/index";
import { Paths, useGetList, useMutationApi } from "../factory";

export function useKitchenMutations() {
  const {
    deleteItem: deleteKitchen,
    updateItem: updateKitchen,
    createItem: createKitchen,
  } = useMutationApi<Kitchen>({
    baseQuery: Paths.Kitchen,
  });

  return { deleteKitchen, updateKitchen, createKitchen };
}

export function useGetKitchens() {
  return useGetList<Kitchen>(Paths.Kitchen);
}
