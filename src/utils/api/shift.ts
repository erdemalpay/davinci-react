import { Shift } from "../../types";
import { Paths, useMutationApi } from "./factory";

export function useShiftMutations() {
  const {
    deleteItem: deleteShift,
    updateItem: updateShift,
    createItem: createShift,
  } = useMutationApi<Shift>({
    baseQuery: Paths.Shift,
  });

  return { deleteShift, updateShift, createShift };
}
