import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiMinus, FiPlus } from "react-icons/fi";
import {
  AccountProduct,
  AccountStock,
  Location,
  MenuCategory,
  MenuItem,
  OrderNote,
  TURKISHLIRA,
} from "../../../types";
import { getItem } from "../../../utils/getItem";
import { getMenuItemStockQuantity, OrderDraft } from "./orderDraft";

type Props = {
  menuItem: MenuItem;
  category?: MenuCategory;
  kitchenName?: string;
  initialDraft: OrderDraft;
  isEdit: boolean;
  orderNotes?: OrderNote[];
  stockLocations?: Location[];
  stocks?: AccountStock[];
  products?: AccountProduct[];
  isActivityTable: boolean;
  activityTableNames: string[];
  onSave: (draft: OrderDraft) => void;
  onClose: () => void;
};

const optionClass = (isSelected: boolean) =>
  `px-3 py-2 rounded-xl border text-sm text-left ${
    isSelected
      ? "border-blue-500 bg-blue-50 font-semibold text-gray-900"
      : "border-gray-200 text-gray-700"
  }`;

const OrderItemSheet = ({
  menuItem,
  category,
  kitchenName,
  initialDraft,
  isEdit,
  orderNotes,
  stockLocations,
  stocks,
  products,
  isActivityTable,
  activityTableNames,
  onSave,
  onClose,
}: Props) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(initialDraft);
  const update = (changes: Partial<OrderDraft>) =>
    setDraft((prev) => ({ ...prev, ...changes }));

  const hasProduction = (menuItem.itemProduction?.length ?? 0) > 0;
  const product = products
    ? getItem(menuItem.matchedProduct, products)
    : undefined;
  const notes =
    orderNotes?.filter(
      (note) =>
        note?.categories?.includes(menuItem.category) ||
        note?.items?.includes(menuItem._id)
    ) ?? [];
  const noteParts = draft.note
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const toggleNote = (note: string) =>
    update({
      note: (noteParts.includes(note)
        ? noteParts.filter((part) => part !== note)
        : [...noteParts, note]
      ).join(", "),
    });
  const unitPrice =
    draft.isOnlinePrice && menuItem.onlinePrice
      ? menuItem.onlinePrice
      : menuItem.price;

  return (
    <div
      className="absolute inset-0 z-30 flex items-end md:items-center justify-center bg-gray-900/40"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full md:w-[460px] max-h-[92%] overflow-y-auto overscroll-contain bg-white rounded-t-2xl md:rounded-2xl flex flex-col gap-5 px-5 pt-3 md:pt-5"
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-gray-300 md:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {menuItem.name}
            </h2>
            <p className="text-sm text-gray-500">
              {[category?.name, kitchenName].filter(Boolean).join(", ")}
            </p>
          </div>
          <span className="text-lg font-bold text-gray-900 tabular-nums">
            {unitPrice} {TURKISHLIRA}
          </span>
        </div>

        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-gray-500">
            {t("Quantity")}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={t("Decrease")}
              onClick={() =>
                update({ quantity: Math.max(1, draft.quantity - 1) })
              }
              className="w-12 h-12 rounded-xl bg-gray-100 grid place-items-center text-gray-700 active:scale-95"
            >
              <FiMinus />
            </button>
            <span className="min-w-12 text-center text-2xl font-bold tabular-nums">
              {draft.quantity}
            </span>
            <button
              type="button"
              aria-label={t("Increase")}
              onClick={() => update({ quantity: draft.quantity + 1 })}
              className="w-12 h-12 rounded-xl bg-gray-100 grid place-items-center text-gray-700 active:scale-95"
            >
              <FiPlus />
            </button>
          </div>
        </section>

        {notes.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-gray-500">
              {t("Ready notes")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {notes.map((note) => {
                const isSelected = noteParts.includes(note.note);
                return (
                  <button
                    key={note._id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleNote(note.note)}
                    className={optionClass(isSelected)}
                  >
                    {note.note}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <label
            htmlFor="order-item-note"
            className="text-xs font-semibold text-gray-500"
          >
            {t("Note")}
          </label>
          <textarea
            id="order-item-note"
            rows={2}
            value={draft.note}
            onChange={(e) => update({ note: e.target.value })}
            placeholder={t("Note for the bar or kitchen")}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-base md:text-sm focus:outline-none focus:border-blue-500"
          />
        </section>

        {hasProduction && (
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-gray-500">
              {t("Stock Location")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {stockLocations
                ?.filter(
                  (location) =>
                    (location.isVisibleInOrder ?? true) ||
                    location._id === draft.stockLocation
                )
                .map((location) => {
                  const isSelected = draft.stockLocation === location._id;
                  const shelf = product?.shelfInfo?.find(
                    (info) => info.location === location._id
                  )?.shelf;
                  return (
                    <button
                      key={location._id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => update({ stockLocation: location._id })}
                      className={optionClass(isSelected)}
                    >
                      {location.name}
                      <span className="block text-xs font-normal text-gray-500 tabular-nums">
                        {t("Stock")}:{" "}
                        {getMenuItemStockQuantity(
                          menuItem,
                          location._id,
                          stocks
                        )}
                        {shelf ? `, ${t("Shelf")}: ${shelf}` : ""}
                      </span>
                    </button>
                  );
                })}
            </div>
          </section>
        )}

        {isActivityTable && (
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-gray-500">
              {t("Table")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {activityTableNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={draft.activityTableName === name}
                  onClick={() => update({ activityTableName: name })}
                  className={optionClass(draft.activityTableName === name)}
                >
                  {name}
                </button>
              ))}
            </div>
            <label
              htmlFor="order-item-player"
              className="text-xs font-semibold text-gray-500 mt-1"
            >
              {t("Player Number")}
            </label>
            <input
              id="order-item-player"
              value={draft.activityPlayer}
              onChange={(e) => update({ activityPlayer: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-base md:text-sm focus:outline-none focus:border-blue-500"
            />
          </section>
        )}

        {category?.isOnlineOrder && (
          <label className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-3 text-sm font-medium">
            <span>
              {t("Online Price")}
              {menuItem.onlinePrice !== undefined && (
                <span className="block text-xs font-normal text-gray-500 tabular-nums">
                  {menuItem.onlinePrice} {TURKISHLIRA}
                </span>
              )}
            </span>
            <input
              type="checkbox"
              checked={draft.isOnlinePrice}
              onChange={(e) => update({ isOnlinePrice: e.target.checked })}
              className="w-5 h-5 accent-blue-600"
            />
          </label>
        )}

        <label className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-3 text-sm font-medium">
          <span>
            {t("Add as served")}
            <span className="block text-xs font-normal text-gray-500">
              {t("Check it if it was already given to the table")}
            </span>
          </span>
          <input
            type="checkbox"
            checked={draft.isServed}
            onChange={(e) => update({ isServed: e.target.checked })}
            className="w-5 h-5 accent-blue-600"
          />
        </label>

        <div className="sticky bottom-0 -mx-5 px-5 pt-2 pb-5 bg-white flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-xl bg-gray-100 font-semibold text-gray-700"
          >
            {t("Cancel")}
          </button>
          <button
            type="button"
            onClick={() => onSave({ ...draft, note: draft.note.trim() })}
            className="flex-[2] h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-white tabular-nums"
          >
            {isEdit ? t("Update") : t("Add")} ({unitPrice * draft.quantity}{" "}
            {TURKISHLIRA})
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderItemSheet;
