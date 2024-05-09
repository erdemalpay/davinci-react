import { AccountExpenseType } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/expense-types`;

export function useAccountExpenseTypeMutations() {
  const {
    deleteItem: deleteAccountExpenseType,
    updateItem: updateAccountExpenseType,
    createItem: createAccountExpenseType,
  } = useMutationApi<AccountExpenseType>({
    baseQuery: baseUrl,
    additionalInvalidates: [
      [`${Paths.Accounting}/invoices`],
      [`${Paths.Accounting}/fixture-invoice`],
    ],
  });

  return {
    deleteAccountExpenseType,
    updateAccountExpenseType,
    createAccountExpenseType,
  };
}

export function useGetAccountExpenseTypes() {
  return useGetList<AccountExpenseType>(baseUrl);
}
