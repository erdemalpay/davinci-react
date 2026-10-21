import { MenuItem, Order } from "../types";
import { getItem } from "./getItem";

// Gel-al siparişinin stoğu sipariş anında depodan düşer; teslimde Neorama
// seçilirse backend stoğu Neorama'dan depoya aktarır.
export const PICKUP_DEPOT_LOCATION_ID = 6;
export const NEORAMA_LOCATION_ID = 2;

/**
 * Teslim edilecek satırları seçer. Depodan teslimde yalnızca getirilmiş
 * satırlar gider (#1322: getirilmemiş ürün teslim edilmiş olamaz). Başka
 * yerden teslimde getirilmemiş satırlar da gider, ama henüz çıkmamış ön
 * sipariş ürünü elde olmadığı için gitmez.
 */
export function getPickupDelivery(
  orders: Order[],
  location: number,
  items: MenuItem[]
): { ids: number[]; markBrought: boolean } {
  const deliverable = orders.filter(
    (order) =>
      !order.isShopifyCustomerPicked &&
      (order.isShopifyPickUpOrderBrought ||
        (location !== PICKUP_DEPOT_LOCATION_ID &&
          !getItem(order.item, items)?.isPreOrder))
  );

  return {
    ids: deliverable.map((order) => order._id),
    markBrought: deliverable.some(
      (order) => !order.isShopifyPickUpOrderBrought
    ),
  };
}

/** Teslim geri alınınca stoğun geri döneceği yerler (depodan verilenler hariç). */
export function getStockReturnLocationIds(orders: Order[]): number[] {
  const locationIds = orders.flatMap(
    ({ isShopifyCustomerPicked, shopifyPickUpStockLocation, stockLocation }) =>
      isShopifyCustomerPicked &&
      shopifyPickUpStockLocation != null &&
      shopifyPickUpStockLocation !== stockLocation
        ? [shopifyPickUpStockLocation]
        : []
  );
  return [...new Set(locationIds)];
}
