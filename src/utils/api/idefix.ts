import { DisabledConditionEnum } from "../../types";
import { Paths } from "./factory";
import { MarketplaceChannel } from "./marketplace";

// idefix'te stok ve fiyatın güncel hali inventory/list'ten gelir.
export interface IdefixProduct {
  barcode: string;
  stockCode: string;
  price: number;
  comparePrice: number;
  inventoryQuantity: number;
  active?: boolean;
}

export const IDEFIX_CHANNEL: MarketplaceChannel<IdefixProduct> = {
  label: "idefix",
  path: Paths.IDEFIX,
  menuItemField: "idefixBarcode",
  productKey: "barcode",
  productStock: (product) => product.inventoryQuantity,
  productPrice: (product) => product.price,
  matchResultKey: "idefixBarcode",
  orderNumberField: "idefixOrderNumber",
  lineItemField: "idefixLineItemId",
  ordersDisabledCondition: DisabledConditionEnum.ORDERDATAS_IDEFIXORDERS,
  excelFileName: "IdefixOrders.xlsx",
};
