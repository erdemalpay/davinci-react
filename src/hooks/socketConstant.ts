import { Paths } from "../utils/api/factory";
import { useUserContext } from "./../context/User.context";
import { SocketEventType } from "./../types/index";

export const constantCondition = (socketUser: any, payload: any) => {
  const { user } = useUserContext();

  return socketUser?._id !== user?._id;
};
export const socketEventListeners: SocketEventType[] = [
  {
    event: "rewardChanged",
    invalidateKeys: [`${Paths.Rewards}`],
    condition: constantCondition,
  },
  {
    event: "reservationChanged",
    invalidateKeys: [`${Paths.Reservations}`],
    condition: constantCondition,
  },
  {
    event: "tableChanged",
    invalidateKeys: [`${Paths.Tables}`],
    condition: constantCondition,
  },
  {
    event: "visitChanged",
    invalidateKeys: [`${Paths.Visits}`],
    condition: constantCondition,
  },
  {
    event: "userChanged",
    invalidateKeys: [`${Paths.Users}`],
    condition: constantCondition,
  },
  {
    event: "itemChanged",
    invalidateKeys: [`${Paths.MenuItems}`],
    condition: constantCondition,
  },
  {
    event: "categoryChanged",
    invalidateKeys: [
      `${Paths.MenuCategories}`,
      `${Paths.MenuItems}`,
      `${Paths.MenuPopular}`,
    ],
    condition: constantCondition,
  },
  {
    event: "popularChanged",
    invalidateKeys: [`${Paths.MenuPopular}`, `${Paths.MenuItems}`],
    condition: constantCondition,
  },
  {
    event: "kitchenChanged",
    invalidateKeys: [`${Paths.Kitchen}`],
    condition: constantCondition,
  },
  {
    event: "membershipChanged",
    invalidateKeys: [`${Paths.Memberships}`],
    condition: constantCondition,
  },
  {
    event: "locationChanged",
    invalidateKeys: [`${Paths.Location}`],
    condition: constantCondition,
  },
  {
    event: "gameplayChanged",
    invalidateKeys: [`${Paths.Gameplays}`],
    condition: constantCondition,
  },
  {
    event: "gameChanged",
    invalidateKeys: [`${Paths.Games}`],
    condition: constantCondition,
  },
  {
    event: "pageChanged",
    invalidateKeys: [`${Paths.PanelControl}/pages`],
    condition: constantCondition,
  },
  {
    event: "panelControlChanged",
    invalidateKeys: [`${Paths.PanelControl}`],
    condition: constantCondition,
  },
  {
    event: "checkoutCashChanged",
    invalidateKeys: [`${Paths.PanelControl}/checkout-cash`],
    condition: constantCondition,
  },
  {
    event: "cashoutChanged",
    invalidateKeys: [`${Paths.Checkout}/cashout`],
    condition: constantCondition,
  },
  {
    event: "incomeChanged",
    invalidateKeys: [`${Paths.Checkout}/income`],
    condition: constantCondition,
  },
  {
    event: " checkoutControlChanged",
    invalidateKeys: [`${Paths.Checkout}/checkout-control`],
    condition: constantCondition,
  },
  {
    event: "brandChanged",
    invalidateKeys: [`${Paths.Accounting}/brands`],
    condition: constantCondition,
  },
  {
    event: "countChanged",
    invalidateKeys: [`${Paths.Accounting}/counts`],
    condition: constantCondition,
  },
  {
    event: "countListChanged",
    invalidateKeys: [`${Paths.Accounting}/count-list`],
    condition: constantCondition,
  },
  {
    event: "expenseTypeChanged",
    invalidateKeys: [`${Paths.Accounting}/expense-types`],
    condition: constantCondition,
  },
  {
    event: "fixtureChanged",
    invalidateKeys: [`${Paths.Accounting}/fixtures`],
    condition: constantCondition,
  },
  {
    event: "fixtureCountChanged",
    invalidateKeys: [`${Paths.Accounting}/fixture-counts`],
    condition: constantCondition,
  },
  {
    event: "fixtureInvoiceChanged",
    invalidateKeys: [`${Paths.Accounting}/fixture-invoice`],
    condition: constantCondition,
  },
  {
    event: "fixtureCountListChanged",
    invalidateKeys: [`${Paths.Accounting}/fixture-count-list`],
    condition: constantCondition,
  },
  {
    event: "invoiceChanged",
    invalidateKeys: [`${Paths.Accounting}/invoices`],
    condition: constantCondition,
  },
  {
    event: "packageTypeChanged",
    invalidateKeys: [`${Paths.Accounting}/package-types`],
    condition: constantCondition,
  },
  {
    event: "paymentChanged",
    invalidateKeys: [`${Paths.Accounting}/payments`],
    condition: constantCondition,
  },
  {
    event: "paymentMethodChanged",
    invalidateKeys: [`${Paths.Accounting}/payment-methods`],
    condition: constantCondition,
  },
  {
    event: "productChanged",
    invalidateKeys: [`${Paths.Accounting}/products`],
    condition: constantCondition,
  },
  {
    event: "productStockHistoryChanged",
    invalidateKeys: [`${Paths.Accounting}/product-stock-histories`],
    condition: constantCondition,
  },
  {
    event: "serviceChanged",
    invalidateKeys: [`${Paths.Accounting}/services`],
    condition: constantCondition,
  },
  {
    event: "serviceInvoiceChanged",
    invalidateKeys: [`${Paths.Accounting}/service-invoice`],
    condition: constantCondition,
  },
  {
    event: "stockChanged",
    invalidateKeys: [`${Paths.Accounting}/stocks`],
    condition: constantCondition,
  },
  {
    event: "stockLocationChanged",
    invalidateKeys: [`${Paths.Accounting}/stock-locations`],
    condition: constantCondition,
  },
  {
    event: "unitChanged",
    invalidateKeys: [`${Paths.Accounting}/units`],
    condition: constantCondition,
  },
  {
    event: "vendorChanged",
    invalidateKeys: [`${Paths.Accounting}/vendors`],
    condition: constantCondition,
  },
  {
    event: "discountChanged",
    invalidateKeys: [`${Paths.Order}/discount`],
    condition: constantCondition,
  },
  {
    event: "collectionChanged",
    invalidateKeys: [`${Paths.Order}/collection`],
    condition: constantCondition,
  },
  {
    event: "activityChanged",
    invalidateKeys: [`${Paths.Activity}`],
    condition: () => true,
  },
];
