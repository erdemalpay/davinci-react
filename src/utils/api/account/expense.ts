import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { post } from "..";
import { useGeneralContext } from "../../../context/General.context";
import { AccountExpense, FormElementsState } from "../../../types";
import { Paths, useGet, useGetList, useMutationApi } from "../factory";

export interface AccountExpensePayload {
  data: AccountExpense[];
  totalNumber: number;
  totalPages: number;
  page: number;
  limit: number;
  generalTotalExpense: number;
  overallTotalExpense?: number;
}

export interface CreateMultipleExpense {
  date: string;
  product: string;
  expenseType: string;
  location: string;
  brand?: string;
  vendor: string;
  paymentMethod: string;
  quantity: number;
  price: number;
  vat?: number;
  discount?: number;
  isStockIncrement: boolean;
  note?: string;
}

const baseUrl = `${Paths.Accounting}/expenses`;

export function useAccountExpenseMutations() {
  const {
    deleteItem: deleteAccountExpense,
    updateItem: updateAccountExpense,
    createItem: createAccountExpense,
  } = useMutationApi<AccountExpense>({
    baseQuery: baseUrl,
  });

  return { deleteAccountExpense, updateAccountExpense, createAccountExpense };
}

export function useAccountExpenseSimpleMutations() {
  const { updateItem: updateAccountExpenseSimple } =
    useMutationApi<AccountExpense>({
      baseQuery: `${Paths.Accounting}/expenses/simple`,
    });

  return {
    updateAccountExpenseSimple,
  };
}
export function useGetAccountProductExpenses(product: string) {
  const url = `${Paths.Accounting}/product_expense`;
  return useGetList<AccountExpense>(
    `${url}?product=${product}`,
    [url, product],
    true
  );
}

export function useGetAccountExpenses(
  page: number,
  limit: number,
  filterPanelElements: FormElementsState,
  includeAllTotals = false
) {
  let url = `${Paths.Accounting}/expenses?page=${page}&limit=${limit}&product=${filterPanelElements.product}&service=${filterPanelElements.service}&type=${filterPanelElements.type}&expenseType=${filterPanelElements.expenseType}&location=${filterPanelElements.location}&brand=${filterPanelElements.brand}&vendor=${filterPanelElements.vendor}&before=${filterPanelElements.before}&after=${filterPanelElements.after}&sort=${filterPanelElements.sort}&asc=${filterPanelElements.asc}&date=${filterPanelElements.date}&paymentMethod=${filterPanelElements.paymentMethod}&includeAllTotals=${includeAllTotals}`;

  if (filterPanelElements.search) {
    url = url.concat(`&search=${filterPanelElements.search.trim()}`);
  }
  return useGet<AccountExpensePayload>(
    url,
    [baseUrl, page, limit, filterPanelElements],
    true
  );
}

export function useGetAccountExpensesWithoutPagination(
  filterPanelElements: FormElementsState
) {
  const url = `${Paths.Accounting}/expenses-without-pagination?product=${filterPanelElements.product}&service=${filterPanelElements.service}&type=${filterPanelElements.type}&expenseType=${filterPanelElements.expenseType}&location=${filterPanelElements.location}&brand=${filterPanelElements.brand}&vendor=${filterPanelElements.vendor}&before=${filterPanelElements.before}&after=${filterPanelElements.after}&sort=${filterPanelElements.sort}&asc=${filterPanelElements.asc}&date=${filterPanelElements.date}&paymentMethod=${filterPanelElements.paymentMethod}`;

  return useGet<AccountExpense[]>(url, [baseUrl, filterPanelElements], true);
}

export function createMultipleExpense(
  createExpenseDto: CreateMultipleExpense[]
) {
  return post({
    path: `${Paths.Accounting}/expenses/create-multiple`,
    payload: createExpenseDto,
  });
}
export function useCreateMultipleExpenseMutation() {
  const queryKey = [`${Paths.Accounting}/expenses/create-multiple`];
  const queryClient = useQueryClient();
  const { setErrorDataForCreateMultipleExpense } = useGeneralContext();
  return useMutation({
    mutationFn: createMultipleExpense,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
    },
    onSettled: (response) => {
      if (response) {
        setErrorDataForCreateMultipleExpense(
          response as CreateMultipleExpense[]
        );
      }
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}
