import { describe, expect, it } from "vitest";
import {
  Kitchen,
  MenuCategory,
  MenuItem,
  OnlineLocationId,
  OrderStatus,
  Table,
} from "../../../types";
import {
  buildOrderObject,
  getMenuItemStockQuantity,
  OrderDraft,
} from "./orderDraft";

const menuItem = (overrides: Partial<MenuItem> = {}): MenuItem => ({
  trendyolBarcode: undefined,
  _id: 50,
  name: "Latte",
  description: "",
  imageUrl: "",
  category: 1,
  order: 1,
  price: 170,
  onlinePrice: 150,
  locations: [2],
  priceHistory: [],
  ...overrides,
});

const category = (overrides: Partial<MenuCategory> = {}): MenuCategory => ({
  _id: 1,
  name: "Coffee",
  order: 1,
  imageUrl: "",
  locations: [2],
  kitchen: "bar",
  isAutoServed: false,
  active: true,
  orderCategoryOrder: 1,
  ...overrides,
});

const kitchen = (overrides: Partial<Kitchen> = {}): Kitchen => ({
  _id: "bar",
  name: "Bar",
  isConfirmationRequired: false,
  locations: [2],
  ...overrides,
});

const table: Table = {
  _id: 85812,
  name: "21",
  date: "2026-10-20",
  playerCount: 2,
  location: 2,
  startHour: "12:09",
  gameplays: [],
  isAutoEntryAdded: false,
  createdBy: "hilmi",
};

const draft = (overrides: Partial<OrderDraft> = {}): OrderDraft => ({
  item: 50,
  quantity: 2,
  note: "",
  stockLocation: 2,
  isOnlinePrice: false,
  activityTableName: "",
  activityPlayer: "",
  isServed: false,
  ...overrides,
});

const context = (
  overrides: Partial<Parameters<typeof buildOrderObject>[1]> = {}
) => ({
  menuItems: [menuItem()],
  categories: [category()],
  kitchens: [kitchen()],
  table,
  user: { _id: "hilmi" },
  selectedLocationId: 2,
  ...overrides,
});

describe("buildOrderObject", () => {
  it("creates a pending order with the menu price", () => {
    const order = buildOrderObject(draft(), context());
    expect(order).toMatchObject({
      item: 50,
      quantity: 2,
      status: OrderStatus.PENDING,
      unitPrice: 170,
      paidQuantity: 0,
      kitchen: "bar",
      location: 2,
      stockLocation: 2,
      table: 85812,
    });
    expect(order).not.toHaveProperty("isServed");
  });

  it("returns null for an unknown item", () => {
    expect(buildOrderObject(draft({ item: 999 }), context())).toBeNull();
  });

  it("uses the online price when asked", () => {
    expect(
      buildOrderObject(draft({ isOnlinePrice: true }), context())?.unitPrice
    ).toBe(150);
  });

  it("asks for confirmation when the kitchen requires it", () => {
    const order = buildOrderObject(
      draft(),
      context({ kitchens: [kitchen({ isConfirmationRequired: true })] })
    );
    expect(order?.status).toBe(OrderStatus.CONFIRMATIONREQ);
  });

  it("marks auto served items as served by the user", () => {
    const order = buildOrderObject(
      draft(),
      context({ categories: [category({ isAutoServed: true })] })
    );
    expect(order).toMatchObject({
      status: OrderStatus.AUTOSERVED,
      deliveredBy: "hilmi",
      preparedBy: "hilmi",
    });
  });

  it("marks auto prepared items as ready to serve", () => {
    const order = buildOrderObject(
      draft(),
      context({ menuItems: [menuItem({ isAutoPrepared: true })] })
    );
    expect(order?.status).toBe(OrderStatus.READYTOSERVE);
  });

  it("sends a line marked as served as served", () => {
    const order = buildOrderObject(draft({ isServed: true }), context());
    expect(order).toMatchObject({
      status: OrderStatus.SERVED,
      deliveredBy: "hilmi",
    });
  });

  it("keeps an auto served line auto served when marked as served", () => {
    const order = buildOrderObject(
      draft({ isServed: true }),
      context({ categories: [category({ isAutoServed: true })] })
    );
    expect(order?.status).toBe(OrderStatus.AUTOSERVED);
  });

  it("uses the online location for online sale tables", () => {
    const order = buildOrderObject(
      draft(),
      context({ table: { ...table, isOnlineSale: true } })
    );
    expect(order?.location).toBe(OnlineLocationId);
  });

  it("sets the order taker when given", () => {
    expect(
      buildOrderObject(draft(), context({ createdBy: "ece" }))?.createdBy
    ).toBe("ece");
  });
});

describe("getMenuItemStockQuantity", () => {
  const stocks = [
    { _id: "1", product: "milk", location: 2, quantity: 4 },
    { _id: "2", product: "coffee", location: 2, quantity: 9 },
  ];

  it("returns the lowest production stock", () => {
    const item = menuItem({
      itemProduction: [
        { product: "milk", quantity: 1, isDecrementStock: true },
        { product: "coffee", quantity: 1, isDecrementStock: true },
      ],
    });
    expect(getMenuItemStockQuantity(item, 2, stocks)).toBe(4);
  });

  it("returns 0 when a product has no stock at the location", () => {
    const item = menuItem({
      itemProduction: [{ product: "milk", quantity: 1 }],
    });
    expect(getMenuItemStockQuantity(item, 6, stocks)).toBe(0);
  });
});
