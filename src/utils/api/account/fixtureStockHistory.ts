import { AccountFixtureStockHistory } from "../../../types";
import { Paths, useGetList } from "../factory";

const baseUrl = `${Paths.Accounting}/fixture-stock-histories`;

export function useGetAccountFixtureStockHistorys() {
  return useGetList<AccountFixtureStockHistory>(baseUrl);
}
