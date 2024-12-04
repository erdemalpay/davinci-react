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
  filterPanelElements: FormElementsState
) {
  return useGet<StockHistoryPayload>(
    `${baseUrl}?page=${page}&limit=${limit}&product=${filterPanelElements.product}&expenseType=${filterPanelElements.expenseType}&location=${filterPanelElements.location}&status=${filterPanelElements.status}&before=${filterPanelElements.before}&after=${filterPanelElements.after}&sort=${filterPanelElements.sort}&asc=${filterPanelElements.asc}&vendor=${filterPanelElements.vendor}&brand=${filterPanelElements.brand}`,
    [baseUrl, page, limit, filterPanelElements],
    true
  );
}
