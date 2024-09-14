import { AccountService } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/services`;
export function useAccountServiceMutations() {
  const {
    deleteItem: deleteAccountService,
    updateItem: updateAccountService,
    createItem: createAccountService,
  } = useMutationApi<AccountService>({
    baseQuery: baseUrl,
  });

  return { deleteAccountService, updateAccountService, createAccountService };
}

export function useGetAccountServices() {
  return useGetList<AccountService>(baseUrl);
}
