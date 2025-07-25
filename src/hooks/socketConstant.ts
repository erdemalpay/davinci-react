import { SocketEventType } from "../types";
import { Paths } from "../utils/api/factory";

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
    invalidateKeys: [`${Paths.MenuItems}`, `${Paths.MenuItems}/all`],
  },
  {
    event: "upperCategoryChanged",
    invalidateKeys: [`${Paths.MenuUpperCategories}`],
  },
  {
    event: "panelSettingsChanged",
    invalidateKeys: [`${Paths.PanelControl}/panel-settings`],
  },
  {
    event: "categoryChanged",
    invalidateKeys: [
      `${Paths.MenuCategories}`,
      `${Paths.MenuItems}`,
      `${Paths.MenuPopular}`,
      `${Paths.Menu}/categories-all`,
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
    invalidateKeys: [
      `${Paths.Location}`,
      `${Paths.Location}/stock`,
      `${Paths.Location}/all`,
    ],
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
    event: "checkoutControlChanged",
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
    event: "expenseChanged",
    invalidateKeys: [
      `${Paths.Accounting}/expenses`,
      `${Paths.Accounting}/products`,
    ],
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
    invalidateKeys: [
      `${Paths.Accounting}/products`,
      `${Paths.Accounting}/all-products`,
    ],
  },
  {
    event: "productStockHistoryChanged",
    invalidateKeys: [`${Paths.Accounting}/product-stock-histories`],
  },
  {
    event: "ikasProductStockChanged",
    invalidateKeys: [`${Paths.Ikas}/product`],
  },
  {
    event: "serviceChanged",
    invalidateKeys: [`${Paths.Accounting}/services`],
  },
  {
    event: "stockLocationChanged",
    invalidateKeys: [`${Paths.Accounting}/stock-locations`],
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
    event: "activityChanged",
    invalidateKeys: [`${Paths.Activity}`],
  },
  {
    event: "todayOrdersChanged",
    invalidateKeys: [`${Paths.Order}/today`],
  },
  {
    event: "assetChanged",
    invalidateKeys: [`${Paths.Asset}`],
  },
  {
    event: "checklistChanged",
    invalidateKeys: [`${Paths.Checklist}`],
  },
  {
    event: "checkChanged",
    invalidateKeys: [`${Paths.Checklist}/check`],
  },
  {
    event: "productCategoryChanged",
    invalidateKeys: [`${Paths.Accounting}/product-categories`],
  },
  {
    event: "bulkProductAndMenuItemChanged",
    invalidateKeys: [`${Paths.Accounting}/products`, `${Paths.MenuItems}`],
  },
  {
    event: "buttonCallChanged",
    invalidateKeys: [`${Paths.ButtonCalls}`],
  },
  {
    event: "shiftChanged",
    invalidateKeys: [`${Paths.Shift}`],
  },
  {
    event: "expirationListChanged",
    invalidateKeys: [`${Paths.Expiration}/lists`],
  },
  {
    event: "expirationCountChanged",
    invalidateKeys: [`${Paths.Expiration}/counts`],
  },
  {
    event: "notificationRemoved",
    invalidateKeys: [
      `${Paths.Notification}/new`,
      `${Paths.Notification}/all`,
      `${Paths.Notification}/event`,
    ],
  },
  {
    event: "authorizationChanged",
    invalidateKeys: [`${Paths.Authorization}`],
  },
  {
    event: "educationChanged",
    invalidateKeys: [`${Paths.Education}`],
  },
  {
    event: "orderNotesChanged",
    invalidateKeys: [`${Paths.Order}/notes`],
  },
  {
    event: "cafeActivityChanged",
    invalidateKeys: [`${Paths.CafeActivity}`],
  },
  { event: "notificationChanged", invalidateKeys: [`${Paths.Notification}`] },
];
