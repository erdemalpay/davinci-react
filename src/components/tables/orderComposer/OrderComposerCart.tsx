import { useTranslation } from "react-i18next";
import { FiChevronDown, FiMinus, FiPlus } from "react-icons/fi";
import {
  Location,
  MenuItem,
  Order,
  OrderNote,
  OrderStatus,
  TURKISHLIRA,
} from "../../../types";
import { getItem } from "../../../utils/getItem";
import OrderListForPanelTab from "../OrderListForPanelTab";
import { OrderDraft } from "./orderDraft";

export type CartTab = "new" | "waiting" | "served";

const WAITING_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.READYTOSERVE,
  OrderStatus.CONFIRMATIONREQ,
];
const SERVED_STATUSES = [OrderStatus.SERVED, OrderStatus.AUTOSERVED];

type Props = {
  title: string;
  tableId: number;
  tableOrders: Order[];
  drafts: OrderDraft[];
  menuItems?: MenuItem[];
  stockLocations?: Location[];
  orderNotes?: OrderNote[];
  isActivityTable: boolean;
  tab: CartTab;
  setTab: (tab: CartTab) => void;
  draftPrice: (draft: OrderDraft) => number;
  totalQuantity: number;
  totalPrice: number;
  missingMessage: string;
  onChangeQuantity: (index: number, delta: number) => void;
  onEdit: (index: number) => void;
  onToggleServed: (index: number) => void;
  onDelete: (index: number) => void;
  onToggleAllServed: () => void;
  onSend: () => void;
  onCloseMobile: () => void;
};

const OrderComposerCart = ({
  title,
  tableId,
  tableOrders,
  drafts,
  menuItems,
  stockLocations,
  orderNotes,
  isActivityTable,
  tab,
  setTab,
  draftPrice,
  totalQuantity,
  totalPrice,
  missingMessage,
  onChangeQuantity,
  onEdit,
  onToggleServed,
  onDelete,
  onToggleAllServed,
  onSend,
  onCloseMobile,
}: Props) => {
  const { t } = useTranslation();
  const activeOrders = tableOrders.filter(
    (order) => order.status !== OrderStatus.CANCELLED
  );
  const counts: Record<CartTab, number> = {
    new: drafts.length,
    waiting: activeOrders.filter((order) =>
      WAITING_STATUSES.includes(order.status as OrderStatus)
    ).length,
    served: activeOrders.filter((order) =>
      SERVED_STATUSES.includes(order.status as OrderStatus)
    ).length,
  };
  const tabs: { key: CartTab; label: string }[] = [
    { key: "new", label: t("New") },
    { key: "waiting", label: t("Waiting") },
    { key: "served", label: t("Served") },
  ];
  const foodNotes =
    orderNotes?.filter((note) => note.isServedWithFood).map((n) => n.note) ??
    [];

  return (
    <div className="flex flex-col min-h-0 h-full bg-white">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label={t("Back to menu")}
          className="ml-auto w-10 h-10 rounded-xl bg-gray-100 grid place-items-center text-gray-600 md:hidden"
        >
          <FiChevronDown />
        </button>
      </div>
      <div
        role="tablist"
        className="mx-4 flex gap-1 rounded-xl bg-gray-100 p-1"
      >
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
              tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            {label}{" "}
            <span
              className={`tabular-nums ${
                tab === key ? "text-blue-600" : "text-gray-400"
              }`}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2">
        {tab === "new" &&
          (drafts.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">
              {t("Tap a product in the menu to add it here.")}
            </p>
          ) : (
            drafts.map((draft, index) => {
              const menuItem = menuItems
                ? getItem(draft.item, menuItems)
                : undefined;
              const details = [
                draft.note && `"${draft.note}"`,
                foodNotes.some((note) => draft.note.includes(note)) &&
                  t("Served with food"),
                (menuItem?.itemProduction?.length ?? 0) > 0 &&
                  stockLocations &&
                  getItem(draft.stockLocation, stockLocations)?.name,
                draft.isOnlinePrice && t("Online Price"),
                isActivityTable &&
                  `${t("TableShort")}:${draft.activityTableName || "?"} ${t(
                    "PlayerShort"
                  )}:${draft.activityPlayer || "?"}`,
                draft.isServed && t("Served"),
              ].filter(Boolean);
              return (
                <div
                  key={index}
                  className="py-3 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold text-gray-900">
                      {menuItem?.name}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {draftPrice(draft)} {TURKISHLIRA}
                    </span>
                  </div>
                  {details.length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {details.join(", ")}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="flex items-center rounded-xl bg-gray-100">
                      <button
                        type="button"
                        aria-label={t("Decrease")}
                        onClick={() => onChangeQuantity(index, -1)}
                        className="w-10 h-10 grid place-items-center text-gray-700"
                      >
                        <FiMinus />
                      </button>
                      <span className="min-w-6 text-center font-bold tabular-nums">
                        {draft.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={t("Increase")}
                        onClick={() => onChangeQuantity(index, 1)}
                        className="w-10 h-10 grid place-items-center text-gray-700"
                      >
                        <FiPlus />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEdit(index)}
                      className="h-10 px-3 rounded-xl bg-gray-100 text-xs font-semibold text-gray-700"
                    >
                      {t("Edit")}
                    </button>
                    <button
                      type="button"
                      aria-pressed={draft.isServed}
                      onClick={() => onToggleServed(index)}
                      className={`h-10 px-3 rounded-xl text-xs font-semibold ${
                        draft.isServed
                          ? "bg-blue-50 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {t("Served")}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(index)}
                      className="ml-auto h-10 px-3 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      {t("Delete")}
                    </button>
                  </div>
                </div>
              );
            })
          ))}
        {tab === "waiting" && (
          <OrderListForPanelTab
            tableId={tableId}
            tableOrdersProp={tableOrders}
            orderStatus={WAITING_STATUSES}
          />
        )}
        {tab === "served" && (
          <OrderListForPanelTab
            tableId={tableId}
            tableOrdersProp={tableOrders}
            orderStatus={SERVED_STATUSES}
          />
        )}
      </div>

      {tab === "new" && (
        <div className="border-t border-gray-100 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] flex flex-col gap-3">
          <div className="flex items-baseline justify-between text-sm text-gray-500">
            <span className="tabular-nums">
              {totalQuantity} {t("pcs")}
            </span>
            <button
              type="button"
              disabled={drafts.length === 0}
              onClick={onToggleAllServed}
              className="text-xs font-semibold text-gray-600 disabled:opacity-40"
            >
              {t("Mark all as served")}
            </button>
            <span className="text-xl font-bold text-gray-900 tabular-nums">
              {totalPrice} {TURKISHLIRA}
            </span>
          </div>
          {missingMessage && drafts.length > 0 && (
            <p className="text-sm text-red-600">{missingMessage}</p>
          )}
          <button
            type="button"
            disabled={drafts.length === 0 || Boolean(missingMessage)}
            onClick={onSend}
            className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-px"
          >
            {t("Send order")}
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderComposerCart;
