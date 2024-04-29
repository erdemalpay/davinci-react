import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AccountInvoice } from "../../../types";
import { patch } from ".././index";
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
export function transferToFixtureInvoice({ id }: { id: number }) {
  return patch({
    path: `${baseUrl}/transfer_to_fixture_invoice/${id}`,
    payload: {
      id: id,
    },
  });
}
export function transferToServiceInvoice({ id }: { id: number }) {
  return patch({
    path: `${baseUrl}/transfer_to_service_invoice/${id}`,
    payload: {
      id: id,
    },
  });
}
export function useTransferFixtureInvoiceMutation() {
  const queryKey = [baseUrl];
  const queryClient = useQueryClient();
  return useMutation(transferToFixtureInvoice, {
    onMutate: async () => {
      await queryClient.cancelQueries(queryKey);
    },
    onSettled: () => {
      queryClient.invalidateQueries(queryKey);
      queryClient.invalidateQueries([`${Paths.Accounting}/fixture-invoice`]);
    },
  });
}
export function useTransferServiceInvoiceMutation() {
  const queryKey = [baseUrl];
  const queryClient = useQueryClient();
  return useMutation(transferToServiceInvoice, {
    onMutate: async () => {
      await queryClient.cancelQueries(queryKey);
    },
    onSettled: () => {
      queryClient.invalidateQueries(queryKey);
      queryClient.invalidateQueries([`${Paths.Accounting}/service-invoice`]);
    },
  });
}

export function useGetAccountInvoices() {
  return useGetList<AccountInvoice>(baseUrl);
}
