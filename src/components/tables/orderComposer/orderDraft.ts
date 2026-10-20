import {
  AccountStock,
  Kitchen,
  MenuCategory,
  MenuItem,
  OnlineLocationId,
  Order,
  OrderStatus,
  Table,
  User,
} from "../../../types";
import { getItem } from "../../../utils/getItem";

// One line of the order being composed, before it is sent.
export type OrderDraft = {
  item: number;
  quantity: number;
  note: string;
  stockLocation: number;
  isOnlinePrice: boolean;
  activityTableName: string;
  activityPlayer: string;
  // Marked as served before sending (the bell on the new order list).
  isServed: boolean;
};

type BuildContext = {
  menuItems: MenuItem[];
  categories: MenuCategory[];
  kitchens?: Kitchen[];
  table: Table;
  user: Pick<User, "_id">;
  selectedLocationId: number;
  createdBy?: string;
};

// Lowest stock among the item's production products at the location.
export function getMenuItemStockQuantity(
  item: MenuItem,
  location: number,
  stocks?: AccountStock[]
) {
  if (item?.itemProduction && item.itemProduction.length > 0) {
    const minItemProductionStock = item.itemProduction.map((production) => {
      const stock = stocks?.find((stock) => {
        return (
          stock.product === production.product && stock.location === location
        );
      });
      return stock?.quantity ?? 0;
    });
    return Math.min(...minItemProductionStock);
  } else if (item?.matchedProduct) {
    const stock = stocks?.find((stock) => {
      return (
        stock.product === item.matchedProduct && stock.location === location
      );
    });
    return stock?.quantity ?? 0;
  }
  return 0;
}

export function buildOrderObject(
  draft: OrderDraft,
  {
    menuItems,
    categories,
    kitchens,
    table,
    user,
    selectedLocationId,
    createdBy,
  }: BuildContext
): Partial<Order> | null {
  const selectedMenuItem = getItem(draft.item, menuItems);
  if (!selectedMenuItem) return null;
  const selectedMenuItemCategory = getItem(
    selectedMenuItem.category,
    categories
  );
  const selectedItemKitchen = kitchens
    ? getItem(selectedMenuItemCategory?.kitchen, kitchens)
    : undefined;
  const { isServed, ...form } = draft;
  const base = {
    ...form,
    ...(createdBy ? { createdBy } : {}),
    location: table?.isOnlineSale ? OnlineLocationId : selectedLocationId,
    table: table._id,
    unitPrice: draft.isOnlinePrice
      ? selectedMenuItem.onlinePrice ?? selectedMenuItem.price
      : selectedMenuItem.price,
    paidQuantity: 0,
    kitchen: selectedMenuItemCategory?.kitchen,
    stockLocation: draft.stockLocation ?? selectedLocationId,
    tableDate: new Date(table.date),
  };
  let order: Partial<Order>;
  if (selectedMenuItemCategory?.isAutoServed || selectedMenuItem.isAutoServed) {
    order = {
      ...base,
      createdAt: new Date(),
      deliveredAt: new Date(),
      deliveredBy: user._id,
      preparedAt: new Date(),
      preparedBy: user._id,
      status: OrderStatus.AUTOSERVED,
    };
  } else if (selectedMenuItem.isAutoPrepared) {
    order = {
      ...base,
      createdAt: new Date(),
      status: OrderStatus.READYTOSERVE,
    };
  } else {
    order = {
      ...base,
      status: selectedItemKitchen?.isConfirmationRequired
        ? OrderStatus.CONFIRMATIONREQ
        : OrderStatus.PENDING,
    };
  }
  if (isServed && order.status !== OrderStatus.AUTOSERVED) {
    order = {
      ...order,
      status: OrderStatus.SERVED,
      deliveredAt: new Date(),
      deliveredBy: user._id,
    };
  }
  return order;
}
