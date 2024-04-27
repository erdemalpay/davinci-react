import { AccountServiceInvoice } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/service-invoice`;

export function useAccountServiceInvoiceMutations() {
  const {
    deleteItem: deleteAccountServiceInvoice,
    updateItem: updateAccountServiceInvoice,
    createItem: createAccountServiceInvoice,
  } = useMutationApi<AccountServiceInvoice>({
    baseQuery: baseUrl,
  });

  return {
    deleteAccountServiceInvoice,
    updateAccountServiceInvoice,
    createAccountServiceInvoice,
  };
}

export function useGetAccountServiceInvoices() {
  return useGetList<AccountServiceInvoice>(baseUrl);
}
