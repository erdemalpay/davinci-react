import { AccountCount } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/counts`;
export function useAccountCountMutations() {
  const { updateItem: updateAccountCount, createItem: createAccountCount } =
    useMutationApi<AccountCount>({
      baseQuery: baseUrl,
    });

  return {
    updateAccountCount,
    createAccountCount,
  };
}

export function useGetAccountCounts() {
  return useGetList<AccountCount>(baseUrl);
}
