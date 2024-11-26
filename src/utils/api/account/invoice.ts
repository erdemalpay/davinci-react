import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AccountInvoice, FormElementsState } from "../../../types";
import { patch } from ".././index";
import { Paths, useGet, useGetList, useMutationApi } from "../factory";

export interface AccountInvoicePayload {
  data: AccountInvoice[];
  totalNumber: number;
  totalPages: number;
  page: number;
  limit: number;
  generalTotalExpense: number;
}
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

export function transferToServiceInvoice({ id }: { id: number }) {
  return patch({
    path: `${baseUrl}/transfer_to_service_invoice/${id}`,
    payload: {
      id: id,
    },
  });
}
export function transferServiceInvoiceToInvoice({ id }: { id: number }) {
  return patch({
    path: `${baseUrl}/transfer_service_invoice_to_invoice/${id}`,
    payload: {
      id: id,
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
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}
export function useServiceInvoiceTransferInvoiceMutation() {
  const queryKey = [baseUrl];
  const queryClient = useQueryClient();
  return useMutation(transferServiceInvoiceToInvoice, {
    onMutate: async () => {
      await queryClient.cancelQueries(queryKey);
    },
    onSettled: () => {
      queryClient.invalidateQueries(queryKey);
      queryClient.invalidateQueries([`${Paths.Accounting}/service-invoice`]);
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export function useGetAccountInvoices() {
  return useGetList<AccountInvoice>(baseUrl);
}
export function useGetAccountProductInvoices(product: string) {
  const url = `${Paths.Accounting}/product_invoice`;
  return useGetList<AccountInvoice>(
    `${url}?product=${product}`,
    [url, product],
    false
  );
}

export function useGetAccountExpense(
  page: number,
  limit: number,
  filterPanelElements: FormElementsState
) {
  return useGet<AccountInvoicePayload>(
    `${Paths.Accounting}/expenses?page=${page}&limit=${limit}&product=${filterPanelElements.product}&service=${filterPanelElements.service}&type=${filterPanelElements.type}&expenseType=${filterPanelElements.expenseType}&location=${filterPanelElements.location}&brand=${filterPanelElements.brand}&vendor=${filterPanelElements.vendor}&before=${filterPanelElements.before}&after=${filterPanelElements.after}&sort=${filterPanelElements.sort}&asc=${filterPanelElements.asc}`,
    [baseUrl, page, limit, filterPanelElements],
    false
  );
}
