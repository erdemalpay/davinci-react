import { AccountProductStockHistory } from "../../../types";
import { Paths, useGetList } from "../factory";

const baseUrl = `${Paths.Accounting}/product-stock-histories`;

export function useGetAccountProductStockHistorys() {
  return useGetList<AccountProductStockHistory>(baseUrl);
}
