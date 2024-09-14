import { AccountExpenseType } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/expense-types`;

export function useAccountExpenseTypeMutations() {
  const {
    deleteItem: deleteAccountExpenseType,
    updateItem: updateAccountExpenseType,
    createItem: createAccountExpenseType,
  } = useMutationApi<AccountExpenseType>({
    isAdditionalInvalidate: true,
    baseQuery: baseUrl,
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
