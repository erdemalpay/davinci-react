import { AccountFixture } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/fixtures`;
export function useAccountFixtureMutations() {
  const {
    deleteItem: deleteAccountFixture,
    updateItem: updateAccountFixture,
    createItem: createAccountFixture,
  } = useMutationApi<AccountFixture>({
    baseQuery: baseUrl,
    additionalInvalidates: [[`${Paths.Accounting}/fixture-invoice`]],
  });

  return { deleteAccountFixture, updateAccountFixture, createAccountFixture };
}

export function useGetAccountFixtures() {
  return useGetList<AccountFixture>(baseUrl);
}
