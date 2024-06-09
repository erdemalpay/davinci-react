import { AccountFixtureCountList } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/fixture-count-list`;
export function useAccountFixtureCountListMutations() {
  const {
    deleteItem: deleteAccountFixtureCountList,
    updateItem: updateAccountFixtureCountList,
    createItem: createAccountFixtureCountList,
  } = useMutationApi<AccountFixtureCountList>({
    baseQuery: baseUrl,
  });

  return {
    deleteAccountFixtureCountList,
    updateAccountFixtureCountList,
    createAccountFixtureCountList,
  };
}

export function useGetAccountFixtureCountLists() {
  return useGetList<AccountFixtureCountList>(baseUrl);
}
