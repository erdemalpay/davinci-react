import { DisabledConditionEnum } from "../../types";
import { Paths } from "./factory";
import { MarketplaceChannel } from "./marketplace";

export interface N11Product {
  n11ProductId: number;
  stockCode: string;
  barcode: string | null;
  title: string;
  status: string;
  saleStatus: string;
  quantity: number;
  salePrice: number;
  listPrice: number;
}

export const N11_CHANNEL: MarketplaceChannel<N11Product> = {
  label: "n11",
  path: Paths.N11,
  menuItemField: "n11StockCode",
  productKey: "stockCode",
  productStock: (product) => product.quantity,
  productPrice: (product) => product.salePrice,
  matchResultKey: "stockCode",
  orderNumberField: "n11OrderNumber",
  lineItemField: "n11LineItemId",
  ordersDisabledCondition: DisabledConditionEnum.ORDERDATAS_N11ORDERS,
  excelFileName: "N11Orders.xlsx",
};
