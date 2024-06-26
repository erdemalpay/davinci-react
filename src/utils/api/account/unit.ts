import { AccountUnit } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/units`;
export function useAccountUnitMutations() {
  const {
    deleteItem: deleteAccountUnit,
    updateItem: updateAccountUnit,
    createItem: createAccountUnit,
  } = useMutationApi<AccountUnit>({
    baseQuery: baseUrl,
    additionalInvalidates: [
      [`${Paths.Accounting}/products`],
      [`${Paths.Accounting}/invoices`],
    ],
  });

  return { deleteAccountUnit, updateAccountUnit, createAccountUnit };
}

export function useGetAccountUnits() {
  return useGetList<AccountUnit>(baseUrl);
}
