import { AccountUnit } from "../../types";
import { Paths, useGetList, useMutationApi } from "./factory";

export function useAccountUnitMutations() {
  const {
    deleteItem: deleteAccountUnit,
    updateItem: updateAccountUnit,
    createItem: createAccountUnit,
  } = useMutationApi<AccountUnit>({
    baseQuery: Paths.AccountUnit,
  });

  return { deleteAccountUnit, updateAccountUnit, createAccountUnit };
}

export function useGetAccountUnit() {
  return useGetList<AccountUnit>(Paths.AccountUnit);
}
