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
    event: "visitChanged",
    invalidateKeys: [`${Paths.Visits}`],
  },
  {
    event: "userChanged",
    invalidateKeys: [`${Paths.Users}`, `${Paths.Users}/minimal`],
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
      `${Paths.MenuItems}/all`,
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
    event: "stockChanged",
    invalidateKeys: [`${Paths.Accounting}/stocks`],
  },
  {
    event: "gameChanged",
    invalidateKeys: [`${Paths.Games}`, `${Paths.Games}/minimal`],
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
    invalidateKeys: [
      `${Paths.Accounting}/counts`,
      `${Paths.Accounting}/counts/query`,
    ],
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
      `${Paths.Accounting}/expenses-without-pagination`,
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
    invalidateKeys: [
      `${Paths.Checklist}/check`,
      `${Paths.Checklist}/check/query`,
    ],
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
    event: "gameplayTimeChanged",
    invalidateKeys: [`${Paths.GameplayTime}`],
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
  {
    event: "notificationChanged",
    invalidateKeys: [
      `${Paths.Notification}/new`,
      `${Paths.Notification}/all`,
      `${Paths.Notification}/event`,
    ],
  },
  { event: "feedbackChanged", invalidateKeys: [`${Paths.Tables}/feedback`] },
  { event: "todayOrderChanged", invalidateKeys: [`${Paths.Order}/today`] },
  {
    event: "disabledConditionChanged",
    invalidateKeys: [`${Paths.PanelControl}/disabled-conditions`],
  },
  {
    event: "actionChanged",
    invalidateKeys: [`${Paths.PanelControl}/actions`],
  },
  {
    event: "taskTrackChanged",
    invalidateKeys: [`${Paths.PanelControl}/task-tracks`],
  },
  {
    event: "pointChanged",
    invalidateKeys: [`${Paths.Point}`],
  },
  {
    event: "pointHistoryChanged",
    invalidateKeys: [`${Paths.Point}/history`],
  },
  {
    event: "shiftChangeRequestChanged",
    invalidateKeys: [
      `${Paths.ShiftChangeRequest}`,
      `${Paths.ShiftChangeRequest}/my-requests`,
      `${Paths.Shift}`,
    ],
  },
  {
    event: "consumerChanged",
    invalidateKeys: [`${Paths.Consumers}`, `${Paths.Consumers}/full-names`],
  },
  {
    event: "breakChanged",
    invalidateKeys: [`${Paths.Breaks}`],
  },
  {
    event: "shopifyProductStockChanged",
    invalidateKeys: [`${Paths.Shopify}/product`],
  },
];
