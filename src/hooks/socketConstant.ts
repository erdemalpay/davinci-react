import { Paths } from "../utils/api/factory";
import { SocketEventType } from "./../types/index";

export const socketEventListeners: SocketEventType[] = [
  {
    event: "rewardChanged",
    invalidateKeys: [`${Paths.Rewards}`],
    isUserCheck: true,
  },
  {
    event: "reservationChanged",
    invalidateKeys: [`${Paths.Reservations}`],
    isUserCheck: true,
  },
  {
    event: "tableChanged",
    invalidateKeys: [`${Paths.Tables}`],
    isUserCheck: true,
  },
  {
    event: "visitChanged",
    invalidateKeys: [`${Paths.Visits}`],
    isUserCheck: true,
  },
  {
    event: "userChanged",
    invalidateKeys: [`${Paths.Users}`],
    isUserCheck: true,
  },
  {
    event: "itemChanged",
    invalidateKeys: [`${Paths.MenuItems}`],
    isUserCheck: true,
  },
  {
    event: "categoryChanged",
    invalidateKeys: [
      `${Paths.MenuCategories}`,
      `${Paths.MenuItems}`,
      `${Paths.MenuPopular}`,
    ],
    isUserCheck: true,
  },
  {
    event: "popularChanged",
    invalidateKeys: [`${Paths.MenuPopular}`, `${Paths.MenuItems}`],
    isUserCheck: true,
  },
  {
    event: "kitchenChanged",
    invalidateKeys: [`${Paths.Kitchen}`],
    isUserCheck: true,
  },
  {
    event: "membershipChanged",
    invalidateKeys: [`${Paths.Memberships}`],
    isUserCheck: true,
  },
  {
    event: "locationChanged",
    invalidateKeys: [`${Paths.Location}`],
    isUserCheck: true,
  },
  {
    event: "gameplayChanged",
    invalidateKeys: [`${Paths.Gameplays}`],
    isUserCheck: true,
  },
  {
    event: "gameChanged",
    invalidateKeys: [`${Paths.Games}`],
    isUserCheck: true,
  },
  {
    event: "pageChanged",
    invalidateKeys: [`${Paths.PanelControl}/pages`],
    isUserCheck: true,
  },
  {
    event: "panelControlChanged",
    invalidateKeys: [`${Paths.PanelControl}`],
    isUserCheck: true,
  },
  {
    event: "checkoutCashChanged",
    invalidateKeys: [`${Paths.PanelControl}/checkout-cash`],
    isUserCheck: true,
  },
  {
    event: "cashoutChanged",
    invalidateKeys: [`${Paths.Checkout}/cashout`],
    isUserCheck: true,
  },
  {
    event: "incomeChanged",
    invalidateKeys: [`${Paths.Checkout}/income`],
    isUserCheck: true,
  },
  {
    event: " checkoutControlChanged",
    invalidateKeys: [`${Paths.Checkout}/checkout-control`],
    isUserCheck: true,
  },
  {
    event: "brandChanged",
    invalidateKeys: [`${Paths.Accounting}/brands`],
    isUserCheck: true,
  },
  {
    event: "countChanged",
    invalidateKeys: [`${Paths.Accounting}/counts`],
    isUserCheck: true,
  },
  {
    event: "countListChanged",
    invalidateKeys: [`${Paths.Accounting}/count-list`],
    isUserCheck: true,
  },
  {
    event: "expenseTypeChanged",
    invalidateKeys: [`${Paths.Accounting}/expense-types`],
    isUserCheck: true,
  },
  {
    event: "fixtureChanged",
    invalidateKeys: [`${Paths.Accounting}/fixtures`],
    isUserCheck: true,
  },
  {
    event: "fixtureCountChanged",
    invalidateKeys: [`${Paths.Accounting}/fixture-counts`],
    isUserCheck: true,
  },
  {
    event: "fixtureInvoiceChanged",
    invalidateKeys: [`${Paths.Accounting}/fixture-invoice`],
    isUserCheck: true,
  },
  {
    event: "fixtureCountListChanged",
    invalidateKeys: [`${Paths.Accounting}/fixture-count-list`],
    isUserCheck: true,
  },
  {
    event: "invoiceChanged",
    invalidateKeys: [`${Paths.Accounting}/invoices`],
    isUserCheck: true,
  },
  {
    event: "packageTypeChanged",
    invalidateKeys: [`${Paths.Accounting}/package-types`],
    isUserCheck: true,
  },
  {
    event: "paymentChanged",
    invalidateKeys: [`${Paths.Accounting}/payments`],
    isUserCheck: true,
  },
  {
    event: "paymentMethodChanged",
    invalidateKeys: [`${Paths.Accounting}/payment-methods`],
    isUserCheck: true,
  },
  {
    event: "productChanged",
    invalidateKeys: [`${Paths.Accounting}/products`],
    isUserCheck: true,
  },
  {
    event: "productStockHistoryChanged",
    invalidateKeys: [`${Paths.Accounting}/product-stock-histories`],
    isUserCheck: true,
  },
  {
    event: "serviceChanged",
    invalidateKeys: [`${Paths.Accounting}/services`],
    isUserCheck: true,
  },
  {
    event: "serviceInvoiceChanged",
    invalidateKeys: [`${Paths.Accounting}/service-invoice`],
    isUserCheck: true,
  },
  {
    event: "stockChanged",
    invalidateKeys: [`${Paths.Accounting}/stocks`],
    isUserCheck: true,
  },
  {
    event: "stockLocationChanged",
    invalidateKeys: [`${Paths.Accounting}/stock-locations`],
    isUserCheck: true,
  },
  {
    event: "unitChanged",
    invalidateKeys: [`${Paths.Accounting}/units`],
    isUserCheck: true,
  },
  {
    event: "vendorChanged",
    invalidateKeys: [`${Paths.Accounting}/vendors`],
    isUserCheck: true,
  },
  {
    event: "discountChanged",
    invalidateKeys: [`${Paths.Order}/discount`],
    isUserCheck: true,
  },
  {
    event: "collectionChanged",
    invalidateKeys: [`${Paths.Order}/collection`],
    isUserCheck: true,
  },
  {
    event: "activityChanged",
    invalidateKeys: [`${Paths.Activity}`],
    isUserCheck: false,
  },
];
