import { describe, expect, it } from "vitest";
import { MenuItem, Order } from "../types";
import {
  NEORAMA_LOCATION_ID,
  PICKUP_DEPOT_LOCATION_ID,
  getPickupDelivery,
  getStockReturnLocationIds,
} from "./shopifyPickUpDelivery";

const order = (over: Partial<Order>): Order => ({ _id: 1, item: 10, ...over } as Order);
const menuItem = (over: Partial<MenuItem>): MenuItem => ({ _id: 10, ...over } as MenuItem);

const items = [
  menuItem({ _id: 10, isPreOrder: false }),
  menuItem({ _id: 20, isPreOrder: true }),
];

describe("getPickupDelivery — Depo", () => {
  it("yalnızca depodan getirilmiş satırları teslim eder", () => {
    const result = getPickupDelivery(
      [
        order({ _id: 1, isShopifyPickUpOrderBrought: true }),
        order({ _id: 2, isShopifyPickUpOrderBrought: false }),
      ],
      PICKUP_DEPOT_LOCATION_ID,
      items
    );

    expect(result).toEqual({ ids: [1], markBrought: false });
  });

  it("getirilmiş satır yoksa teslim edilecek bir şey döndürmez", () => {
    const result = getPickupDelivery(
      [order({ _id: 1 })],
      PICKUP_DEPOT_LOCATION_ID,
      items
    );

    expect(result.ids).toEqual([]);
  });
});

describe("getPickupDelivery — Neorama", () => {
  it("getirilmemiş satırları da teslim eder ve getirildi işaretler", () => {
    const result = getPickupDelivery(
      [order({ _id: 1 }), order({ _id: 2, isShopifyPickUpOrderBrought: true })],
      NEORAMA_LOCATION_ID,
      items
    );

    expect(result).toEqual({ ids: [1, 2], markBrought: true });
  });

  it("henüz çıkmamış ön sipariş satırını teslim etmez", () => {
    const result = getPickupDelivery(
      [order({ _id: 1 }), order({ _id: 2, item: 20 })],
      NEORAMA_LOCATION_ID,
      items
    );

    expect(result.ids).toEqual([1]);
  });

  it("depoya gelip getirilmiş ön sipariş satırını teslim eder", () => {
    const result = getPickupDelivery(
      [order({ _id: 2, item: 20, isShopifyPickUpOrderBrought: true })],
      NEORAMA_LOCATION_ID,
      items
    );

    expect(result).toEqual({ ids: [2], markBrought: false });
  });

  it("daha önce teslim edilmiş satırı tekrar göndermez", () => {
    const result = getPickupDelivery(
      [order({ _id: 1, isShopifyCustomerPicked: true }), order({ _id: 2 })],
      NEORAMA_LOCATION_ID,
      items
    );

    expect(result.ids).toEqual([2]);
  });

  it("tüm satırlar zaten getirilmişse getirildi işaretini tekrar göndermez", () => {
    const result = getPickupDelivery(
      [order({ _id: 1, isShopifyPickUpOrderBrought: true })],
      NEORAMA_LOCATION_ID,
      items
    );

    expect(result.markBrought).toBe(false);
  });
});

describe("getPickupDelivery — teslim edilmiş satırlar", () => {
  it("depodan teslimde daha önce teslim edilmiş satırı tekrar göndermez", () => {
    const result = getPickupDelivery(
      [
        order({
          _id: 1,
          isShopifyPickUpOrderBrought: true,
          isShopifyCustomerPicked: true,
        }),
        order({ _id: 2, isShopifyPickUpOrderBrought: true }),
      ],
      PICKUP_DEPOT_LOCATION_ID,
      items
    );

    expect(result.ids).toEqual([2]);
  });
});

describe("getStockReturnLocationIds", () => {
  it("Neoramadan verilmiş teslimde stok Neoramaya döner", () => {
    expect(
      getStockReturnLocationIds([
        order({
          isShopifyCustomerPicked: true,
          stockLocation: PICKUP_DEPOT_LOCATION_ID,
          shopifyPickUpStockLocation: NEORAMA_LOCATION_ID,
        }),
      ])
    ).toEqual([NEORAMA_LOCATION_ID]);
  });

  it("depodan verilmiş ya da kaydı olmayan teslimde stok hareketi olmaz", () => {
    expect(
      getStockReturnLocationIds([
        order({
          _id: 1,
          isShopifyCustomerPicked: true,
          stockLocation: PICKUP_DEPOT_LOCATION_ID,
          shopifyPickUpStockLocation: PICKUP_DEPOT_LOCATION_ID,
        }),
        order({ _id: 2, isShopifyCustomerPicked: true }),
      ])
    ).toEqual([]);
  });

  it("aynı lokasyonu bir kez döndürür, teslim edilmemiş satırı saymaz", () => {
    const neoramaLine = {
      stockLocation: PICKUP_DEPOT_LOCATION_ID,
      shopifyPickUpStockLocation: NEORAMA_LOCATION_ID,
    };
    expect(
      getStockReturnLocationIds([
        order({ _id: 1, isShopifyCustomerPicked: true, ...neoramaLine }),
        order({ _id: 2, isShopifyCustomerPicked: true, ...neoramaLine }),
        order({ _id: 3, shopifyPickUpStockLocation: 99 }),
      ])
    ).toEqual([NEORAMA_LOCATION_ID]);
  });
});
