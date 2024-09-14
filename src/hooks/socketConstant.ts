import { Paths } from "../utils/api/factory";
import { SocketEventType } from "./../types/index";

export const socketEventListeners: SocketEventType[] = [
  {
    event: "rewardChanged",
    invalidateKeys: [`${Paths.Rewards}`],
  },
  {
    event: "reservationChanged",
    invalidateKeys: [`${Paths.Reservations}`],
  },
  {
    event: "tableChanged",
    invalidateKeys: [`${Paths.Tables}`],
  },
  {
    event: "visitChanged",
    invalidateKeys: [`${Paths.Visits}`],
  },
  {
    event: "userChanged",
    invalidateKeys: [`${Paths.Users}`],
  },
  {
    event: "itemChanged",
    invalidateKeys: [`${Paths.MenuItems}`],
  },
  {
    event: "categoryChanged",
    invalidateKeys: [
      `${Paths.MenuCategories}`,
      `${Paths.MenuItems}`,
      `${Paths.MenuPopular}`,
    ],
  },
  {
    event: "popularChanged",
    invalidateKeys: [`${Paths.MenuPopular}`, `${Paths.MenuItems}`],
  },
  {
    event: "kitchenChanged",
    invalidateKeys: [`${Paths.Kitchen}`],
  },
  {
    event: "membershipChanged",
    invalidateKeys: [`${Paths.Memberships}`],
  },
  {
    event: "locationChanged",
    invalidateKeys: [`${Paths.Location}`],
  },
  {
    event: "gameplayChanged",
    invalidateKeys: [`${Paths.Gameplays}`],
  },
  {
    event: "gameChanged",
    invalidateKeys: [`${Paths.Games}`],
  },
  {
    event: "pageChanged",
    invalidateKeys: [`${Paths.PanelControl}/pages`],
  },
  {
    event: "panelControlChanged",
    invalidateKeys: [`${Paths.PanelControl}`],
  },
  {
    event: "checkoutCashChanged",
    invalidateKeys: [`${Paths.PanelControl}/checkout-cash`],
  },
  {
    event: "cashoutChanged",
    invalidateKeys: [`${Paths.Checkout}/cashout`],
  },
  {
    event: "incomeChanged",
    invalidateKeys: [`${Paths.Checkout}/income`],
  },
  {
    event: " checkoutControlChanged",
    invalidateKeys: [`${Paths.Checkout}/checkout-control`],
  },
  {
    event: "brandChanged",
    invalidateKeys: [`${Paths.Accounting}/brands`],
  },
  {
    event: "countChanged",
    invalidateKeys: [`${Paths.Accounting}/counts`],
  },
  {
    event: "countListChanged",
    invalidateKeys: [`${Paths.Accounting}/count-list`],
  },
  {
    event: "expenseTypeChanged",
    invalidateKeys: [`${Paths.Accounting}/expense-types`],
  },
  {
    event: "fixtureChanged",
    invalidateKeys: [`${Paths.Accounting}/fixtures`],
  },
  {
    event: "fixtureCountChanged",
    invalidateKeys: [`${Paths.Accounting}/fixture-counts`],
  },
  {
    event: "fixtureInvoiceChanged",
    invalidateKeys: [`${Paths.Accounting}/fixture-invoice`],
  },
  {
    event: "fixtureCountListChanged",
    invalidateKeys: [`${Paths.Accounting}/fixture-count-list`],
  },
  {
    event: "invoiceChanged",
    invalidateKeys: [`${Paths.Accounting}/invoices`],
  },
  {
    event: "packageTypeChanged",
    invalidateKeys: [`${Paths.Accounting}/package-types`],
  },
  {
    event: "paymentChanged",
    invalidateKeys: [`${Paths.Accounting}/payments`],
  },
  {
    event: "paymentMethodChanged",
    invalidateKeys: [`${Paths.Accounting}/payment-methods`],
  },
  {
    event: "productChanged",
    invalidateKeys: [`${Paths.Accounting}/products`],
  },
  {
    event: "productStockHistoryChanged",
    invalidateKeys: [`${Paths.Accounting}/product-stock-histories`],
  },
  {
    event: "serviceChanged",
    invalidateKeys: [`${Paths.Accounting}/services`],
  },
  {
    event: "serviceInvoiceChanged",
    invalidateKeys: [`${Paths.Accounting}/service-invoice`],
  },
  {
    event: "stockChanged",
    invalidateKeys: [`${Paths.Accounting}/stocks`],
  },
  {
    event: "stockLocationChanged",
    invalidateKeys: [`${Paths.Accounting}/stock-locations`],
  },
  {
    event: "unitChanged",
    invalidateKeys: [`${Paths.Accounting}/units`],
  },
  {
    event: "vendorChanged",
    invalidateKeys: [`${Paths.Accounting}/vendors`],
  },
  {
    event: "discountChanged",
    invalidateKeys: [`${Paths.Order}/discount`],
  },
  {
    event: "collectionChanged",
    invalidateKeys: [`${Paths.Order}/collection`],
  },
  {
    event: "activityChanged",
    invalidateKeys: [`${Paths.Activity}`],
  },
];
