import { AccountInvoice } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/invoices`;

export function useAccountInvoiceMutations() {
  const {
    deleteItem: deleteAccountInvoice,
    updateItem: updateAccountInvoice,
    createItem: createAccountInvoice,
  } = useMutationApi<AccountInvoice>({
    baseQuery: baseUrl,
  });

  return { deleteAccountInvoice, updateAccountInvoice, createAccountInvoice };
}

export function useGetAccountInvoices() {
  return useGetList<AccountInvoice>(baseUrl);
}
