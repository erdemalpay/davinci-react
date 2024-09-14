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
    condition: () => true,
  },
  {
    event: "reservationChanged",
    invalidateKeys: [`${Paths.Reservations}`],
    condition: () => true,
  },
  {
    event: "tableChanged",
    invalidateKeys: [`${Paths.Tables}`],
    condition: () => true,
  },
  {
    event: "visitChanged",
    invalidateKeys: [`${Paths.Visits}`],
    condition: () => true,
  },
  {
    event: "userChanged",
    invalidateKeys: [`${Paths.Users}`],
    condition: () => true,
  },
  {
    event: "itemChanged",
    invalidateKeys: [`${Paths.MenuItems}`],
    condition: () => true,
  },
  {
    event: "categoryChanged",
    invalidateKeys: [
      `${Paths.MenuCategories}`,
      `${Paths.MenuItems}`,
      `${Paths.MenuPopular}`,
    ],
    condition: () => true,
  },
  {
    event: "popularChanged",
    invalidateKeys: [`${Paths.MenuPopular}`, `${Paths.MenuItems}`],
    condition: () => true,
  },
  {
    event: "kitchenChanged",
    invalidateKeys: [`${Paths.Kitchen}`],
    condition: () => true,
  },
  {
    event: "membershipChanged",
    invalidateKeys: [`${Paths.Memberships}`],
    condition: () => true,
  },
  {
    event: "locationChanged",
    invalidateKeys: [`${Paths.Location}`],
    condition: () => true,
  },
  {
    event: "gameplayChanged",
    invalidateKeys: [`${Paths.Gameplays}`],
    condition: () => true,
  },
  {
    event: "gameChanged",
    invalidateKeys: [`${Paths.Games}`],
    condition: () => true,
  },
  {
    event: "pageChanged",
    invalidateKeys: [`${Paths.PanelControl}/pages`],
    condition: () => true,
  },
  {
    event: "panelControlChanged",
    invalidateKeys: [`${Paths.PanelControl}`],
    condition: () => true,
  },
  {
    event: "checkoutCashChanged",
    invalidateKeys: [`${Paths.PanelControl}/checkout-cash`],
    condition: () => true,
  },
  {
    event: "cashoutChanged",
    invalidateKeys: [`${Paths.Checkout}/cashout`],
    condition: () => true,
  },
  {
    event: "incomeChanged",
    invalidateKeys: [`${Paths.Checkout}/income`],
    condition: () => true,
  },
  {
    event: " checkoutControlChanged",
    invalidateKeys: [`${Paths.Checkout}/checkout-control`],
    condition: () => true,
  },
  {
    event: "brandChanged",
    invalidateKeys: [`${Paths.Accounting}/brands`],
    condition: () => true,
  },
  {
    event: "countChanged",
    invalidateKeys: [`${Paths.Accounting}/counts`],
    condition: () => true,
  },
  {
    event: "countListChanged",
    invalidateKeys: [`${Paths.Accounting}/count-list`],
    condition: () => true,
  },
  {
    event: "expenseTypeChanged",
    invalidateKeys: [`${Paths.Accounting}/expense-types`],
    condition: () => true,
  },
  {
    event: "fixtureChanged",
    invalidateKeys: [`${Paths.Accounting}/fixtures`],
    condition: () => true,
  },
  {
    event: "fixtureCountChanged",
    invalidateKeys: [`${Paths.Accounting}/fixture-counts`],
    condition: () => true,
  },
  {
    event: "fixtureInvoiceChanged",
    invalidateKeys: [`${Paths.Accounting}/fixture-invoice`],
    condition: () => true,
  },
  {
    event: "fixtureCountListChanged",
    invalidateKeys: [`${Paths.Accounting}/fixture-count-list`],
    condition: () => true,
  },
  {
    event: "invoiceChanged",
    invalidateKeys: [`${Paths.Accounting}/invoices`],
    condition: () => true,
  },
  {
    event: "packageTypeChanged",
    invalidateKeys: [`${Paths.Accounting}/package-types`],
    condition: () => true,
  },
  {
    event: "paymentChanged",
    invalidateKeys: [`${Paths.Accounting}/payments`],
    condition: () => true,
  },
  {
    event: "paymentMethodChanged",
    invalidateKeys: [`${Paths.Accounting}/payment-methods`],
    condition: () => true,
  },
  {
    event: "productChanged",
    invalidateKeys: [`${Paths.Accounting}/products`],
    condition: () => true,
  },
  {
    event: "productStockHistoryChanged",
    invalidateKeys: [`${Paths.Accounting}/product-stock-histories`],
    condition: () => true,
  },
  {
    event: "serviceChanged",
    invalidateKeys: [`${Paths.Accounting}/services`],
    condition: () => true,
  },
  {
    event: "serviceInvoiceChanged",
    invalidateKeys: [`${Paths.Accounting}/service-invoice`],
    condition: () => true,
  },
  {
    event: "stockChanged",
    invalidateKeys: [`${Paths.Accounting}/stocks`],
    condition: () => true,
  },
  {
    event: "stockLocationChanged",
    invalidateKeys: [`${Paths.Accounting}/stock-locations`],
    condition: () => true,
  },
  {
    event: "unitChanged",
    invalidateKeys: [`${Paths.Accounting}/units`],
    condition: () => true,
  },
  {
    event: "vendorChanged",
    invalidateKeys: [`${Paths.Accounting}/vendors`],
    condition: () => true,
  },
  {
    event: "discountChanged",
    invalidateKeys: [`${Paths.Order}/discount`],
    condition: () => true,
  },
  {
    event: "collectionChanged",
    invalidateKeys: [`${Paths.Order}/collection`],
    condition: () => true,
  },
  {
    event: "activityChanged",
    invalidateKeys: [`${Paths.Activity}`],
    condition: () => true,
  },
];
