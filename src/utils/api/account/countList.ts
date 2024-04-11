import { AccountCountList } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/count-list`;
export function useAccountCountListMutations() {
  const {
    deleteItem: deleteAccountCountList,
    updateItem: updateAccountCountList,
    createItem: createAccountCountList,
  } = useMutationApi<AccountCountList>({
    baseQuery: baseUrl,
  });

  return {
    deleteAccountCountList,
    updateAccountCountList,
    createAccountCountList,
  };
}

export function useGetAccountCountLists() {
  return useGetList<AccountCountList>(baseUrl);
}
