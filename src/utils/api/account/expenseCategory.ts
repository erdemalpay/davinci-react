import { AccountExpenseCategory } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/expense-categories`;

export function useAccountExpenseCategoryMutations() {
  const {
    deleteItem: deleteAccountExpenseCategory,
    updateItem: updateAccountExpenseCategory,
    createItem: createAccountExpenseCategory,
  } = useMutationApi<AccountExpenseCategory>({
    baseQuery: baseUrl,
  });

  return {
    deleteAccountExpenseCategory,
    updateAccountExpenseCategory,
    createAccountExpenseCategory,
  };
}

export function useGetAccountExpenseCategorys() {
  return useGetList<AccountExpenseCategory>(baseUrl);
}
