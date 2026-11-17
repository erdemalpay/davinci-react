import { DisabledConditionEnum } from "../../types";
import { Paths } from "./factory";
import { MarketplaceChannel } from "./marketplace";

// Amazon'da stok FBA'dadır ve Amazon'ca yönetilir; panel yalnızca okur.
export interface AmazonProduct {
  sellerSku: string;
  asin: string;
  title?: string;
  barcode: string | null;
  quantity: number;
}

export const AMAZON_CHANNEL: MarketplaceChannel<AmazonProduct> = {
  label: "amazon",
  path: Paths.AMAZON,
  menuItemField: "amazonSku",
  productKey: "sellerSku",
  productStock: (product) => product.quantity,
  matchResultKey: "amazonSku",
  orderNumberField: "amazonOrderNumber",
  lineItemField: "amazonLineItemId",
  ordersDisabledCondition: DisabledConditionEnum.ORDERDATAS_AMAZONORDERS,
  excelFileName: "AmazonOrders.xlsx",
};
