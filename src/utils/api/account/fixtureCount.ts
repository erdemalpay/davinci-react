import { AccountFixtureCount } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/fixture-counts`;
export function useAccountFixtureCountMutations() {
  const {
    updateItem: updateAccountFixtureCount,
    createItem: createAccountFixtureCount,
  } = useMutationApi<AccountFixtureCount>({
    baseQuery: baseUrl,
  });

  return {
    updateAccountFixtureCount,
    createAccountFixtureCount,
  };
}

export function useGetAccountFixtureCounts() {
  return useGetList<AccountFixtureCount>(baseUrl);
}
