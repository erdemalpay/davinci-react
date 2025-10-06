import { CheckoutIncome, FormElementsState } from "../../../types";
import { Paths, useGet, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Checkout}/income`;

export interface CheckoutIncomePayload {
  data: CheckoutIncome[];
  totalNumber: number;
  totalPages: number;
  generalTotal: number;
  page: number;
  limit: number;
}

export function useCheckoutIncomeMutations() {
  const {
    deleteItem: deleteCheckoutIncome,
    updateItem: updateCheckoutIncome,
    createItem: createCheckoutIncome,
  } = useMutationApi<CheckoutIncome>({
    baseQuery: baseUrl,
  });
  return { deleteCheckoutIncome, updateCheckoutIncome, createCheckoutIncome };
}

export function useGetCheckoutIncomes() {
  return useGetList<CheckoutIncome>(baseUrl);
}

export function useGetQueryIncomes(filter: {
  after?: string;
  before?: string;
  date?: string;
}) {
  const url = `${Paths.Checkout}/income/query?after=${
    filter.after || ""
  }&before=${filter.before || ""}&date=${filter.date || ""}`;
  return useGetList<CheckoutIncome>(
    `${url}`,
    [url, filter.after, filter.before, filter.date],
    true
  );
}
export function useGetPaginatedQueryIncomes(
  page: number,
  limit: number,
  filters: FormElementsState
) {
  const parts = [
    `page=${page}`,
    `limit=${limit}`,
    filters.user && `user=${filters.user}`,
    filters.date && `date=${filters.date}`,
    filters.before && `before=${filters.before}`,
    filters.after && `after=${filters.after}`,
    filters.sort && `sort=${filters.sort}`,
    filters.asc !== undefined && `asc=${filters.asc}`,
  ];
  const queryString = parts.filter(Boolean).join("&");
  const url = `${Paths.Checkout}/income/paginated/query?${queryString}`;
  return useGet<CheckoutIncomePayload>(url, [url, page, limit, filters], true);
}
