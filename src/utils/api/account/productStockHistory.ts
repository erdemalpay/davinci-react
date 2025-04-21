import { AccountProductStockHistory, FormElementsState } from "../../../types";
import { Paths, useGet } from "../factory";
export interface StockHistoryPayload {
  data: AccountProductStockHistory[];
  totalNumber: number;
  totalPages: number;
  page: number;
  limit: number;
}

const baseUrl = `${Paths.Accounting}/product-stock-histories`;

export function useGetAccountProductStockHistorys(
  page: number,
  limit: number,
  filters: FormElementsState
) {
  const parts = [
    `page=${page}`,
    `limit=${limit}`,
    filters.product && `product=${filters.product}`,
    filters.expenseType && `expenseType=${filters.expenseType}`,
    filters.location && `location=${filters.location}`,
    filters.status && `status=${filters.status}`,
    filters.before && `before=${filters.before}`,
    filters.after && `after=${filters.after}`,
    filters.sort && `sort=${filters.sort}`,
    filters.asc !== undefined && `asc=${filters.asc}`,
    filters.vendor && `vendor=${filters.vendor}`,
    filters.brand && `brand=${filters.brand}`,
  ];
  const queryString = parts.filter(Boolean).join("&");
  return useGet<StockHistoryPayload>(
    `${baseUrl}?${queryString}`,
    [baseUrl, page, limit, filters],
    true
  );
}
