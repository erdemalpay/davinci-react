import { AccountFixtureInvoice } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/fixture-invoice`;

export function useAccountFixtureInvoiceMutations() {
  const {
    deleteItem: deleteAccountFixtureInvoice,
    updateItem: updateAccountFixtureInvoice,
    createItem: createAccountFixtureInvoice,
  } = useMutationApi<AccountFixtureInvoice>({
    baseQuery: baseUrl,
  });

  return {
    deleteAccountFixtureInvoice,
    updateAccountFixtureInvoice,
    createAccountFixtureInvoice,
  };
}

export function useGetAccountFixtureInvoices() {
  return useGetList<AccountFixtureInvoice>(baseUrl);
}
