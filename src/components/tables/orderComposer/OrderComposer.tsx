import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiMinus, FiMoreHorizontal, FiSearch } from "react-icons/fi";
import { IoIosClose } from "react-icons/io";
import { useDataContext } from "../../../context/Data.context";
import { useLocationContext } from "../../../context/Location.context";
import { useLockBodyScroll } from "../../../hooks/useLockBodyScroll";
import { useOrderTaker } from "../../../hooks/useOrderTaker";
import {
  MenuItem,
  Order,
  Table,
  TableTypes,
  TURKISHLIRA,
} from "../../../types";
import { useGetAccountProducts } from "../../../utils/api/account/product";
import { useGetAccountStocks } from "../../../utils/api/account/stock";
import {
  useCreateMultipleOrderMutation,
  useGetPopularItemsLast30Days,
  useOrderMutations,
} from "../../../utils/api/order/order";
import {
  getItem,
  getMenuItemSubText,
  menuItemHasDecrementStock,
} from "../../../utils/getItem";
import { normalizeText } from "../../../utils/slug";
import { ConfirmationDialog } from "../../common/ConfirmationDialog";
import OrderComposerCart, { CartTab } from "./OrderComposerCart";
import OrderItemSheet from "./OrderItemSheet";
import {
  buildOrderObject,
  getMenuItemStockQuantity,
  OrderDraft,
} from "./orderDraft";

const POPULAR = "popular";

const chipClass = (isSelected: boolean) =>
  `px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${
    isSelected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
  }`;

type Props = {
  table: Table;
  tableOrders: Order[];
  inactiveCategoryNames: string[];
  onClose: () => void;
};

type SheetState = { item: number; index?: number } | null;
type PendingAdd = { draft: OrderDraft; index?: number } | null;

const isSameLine = (a: OrderDraft, b: OrderDraft) =>
  a.item === b.item &&
  a.note === b.note &&
  a.stockLocation === b.stockLocation &&
  a.isOnlinePrice === b.isOnlinePrice &&
  a.activityTableName === b.activityTableName &&
  a.activityPlayer === b.activityPlayer &&
  a.isServed === b.isServed;

const OrderComposer = ({
  table,
  tableOrders,
  inactiveCategoryNames,
  onClose,
}: Props) => {
  const { t } = useTranslation();
  const { menuItems, categories, kitchens, stockLocations, orderNotes, user } =
    useDataContext();
  const { selectedLocationId } = useLocationContext();
  const products = useGetAccountProducts();
  const stocks = useGetAccountStocks();
  const popularItems = useGetPopularItemsLast30Days();
  const { isCounterUser, orderTakerInputs } = useOrderTaker();
  const { createOrder } = useOrderMutations();
  const { mutate: createMultipleOrder } = useCreateMultipleOrderMutation();
  useLockBodyScroll();

  const isActivityTable = table.type === TableTypes.ACTIVITY;
  const defaultStockLocation = table?.isOnlineSale ? 6 : selectedLocationId;
  const takerOptions = orderTakerInputs[0]?.options ?? [];

  const [drafts, setDrafts] = useState<OrderDraft[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    number | typeof POPULAR
  >(POPULAR);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [pendingAdd, setPendingAdd] = useState<PendingAdd>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartTab, setCartTab] = useState<CartTab>("new");
  const [createdBy, setCreatedBy] = useState("");
  const [activityTableName, setActivityTableName] = useState("");
  const [activityPlayer, setActivityPlayer] = useState("");

  const inactiveCategoryIds = useMemo(
    () =>
      categories?.filter((c) => !c.active).map((category) => category._id) ??
      [],
    [categories]
  );

  // Same rules as the old product picker of the add order panel.
  const orderableItems = useMemo(() => {
    if (!menuItems) return [];
    return menuItems.filter((menuItem) => {
      if (inactiveCategoryIds.includes(menuItem.category)) return false;
      if (!menuItem?.locations?.includes(selectedLocationId)) return false;
      const category = categories
        ? getItem(menuItem.category, categories)
        : undefined;
      if (table?.isOnlineSale && !category?.isOnlineOrder) return false;
      if (category?.isLimitedTime && menuItem.endDate) {
        if (new Date() > new Date(menuItem.endDate)) return false;
      }
      return true;
    });
  }, [
    menuItems,
    categories,
    inactiveCategoryIds,
    selectedLocationId,
    table?.isOnlineSale,
  ]);

  const categoryChips = useMemo(
    () =>
      categories
        ?.filter(
          (category) =>
            category.active &&
            category?.locations?.includes(selectedLocationId) &&
            (!table?.isOnlineSale || category.isOnlineOrder)
        )
        ?.sort((a, b) => a.orderCategoryOrder - b.orderCategoryOrder) ?? [],
    [categories, selectedLocationId, table?.isOnlineSale]
  );

  const popularMenuItems = useMemo(
    () =>
      popularItems
        .map((popular) => getItem(popular.value, orderableItems))
        .filter((item): item is MenuItem => Boolean(item)),
    [popularItems, orderableItems]
  );
  const activeCategory =
    selectedCategory === POPULAR && popularMenuItems.length === 0
      ? categoryChips[0]?._id
      : selectedCategory;

  // Null for products that do not use stock.
  const listStockQuantity = useCallback(
    (menuItem: MenuItem) =>
      menuItemHasDecrementStock(menuItem)
        ? getMenuItemStockQuantity(menuItem, defaultStockLocation, stocks)
        : null,
    [defaultStockLocation, stocks]
  );

  const visibleItems = useMemo(() => {
    const query = normalizeText(search.trim());
    const items = query
      ? orderableItems.filter((menuItem) => {
          const category = categories
            ? getItem(menuItem.category, categories)
            : undefined;
          return [menuItem.name, menuItem.sku, menuItem.barcode, category?.name]
            .filter((keyword): keyword is string => Boolean(keyword))
            .some((keyword) => normalizeText(keyword).includes(query));
        })
      : activeCategory === POPULAR
      ? popularMenuItems
      : orderableItems.filter(
          (menuItem) =>
            menuItem.category === activeCategory ||
            menuItem.additionalCategories?.includes(activeCategory)
        );
    // Out of stock products go to the end, the rest keep their order.
    const isOutOfStock = (menuItem: MenuItem) =>
      (listStockQuantity(menuItem) ?? 1) <= 0;
    return [...items].sort(
      (a, b) => Number(isOutOfStock(a)) - Number(isOutOfStock(b))
    );
  }, [
    search,
    orderableItems,
    categories,
    activeCategory,
    popularMenuItems,
    listStockQuantity,
  ]);

  const unitPrice = (draft: OrderDraft) => {
    const menuItem = menuItems ? getItem(draft.item, menuItems) : undefined;
    if (!menuItem) return 0;
    return draft.isOnlinePrice && menuItem.onlinePrice
      ? menuItem.onlinePrice
      : menuItem.price;
  };
  const draftPrice = (draft: OrderDraft) => unitPrice(draft) * draft.quantity;
  const quantityInCart = (itemId: number) =>
    drafts
      .filter((draft) => draft.item === itemId)
      .reduce((sum, draft) => sum + draft.quantity, 0);

  const newDraft = (itemId: number): OrderDraft => ({
    item: itemId,
    quantity: 1,
    note: "",
    stockLocation: defaultStockLocation,
    isOnlinePrice: false,
    activityTableName,
    activityPlayer,
    isServed: false,
  });

  const saveDraft = (draft: OrderDraft, index?: number) => {
    setDrafts((prev) => {
      if (index !== undefined) {
        return prev.map((line, i) => (i === index ? draft : line));
      }
      const sameIndex = prev.findIndex((line) => isSameLine(line, draft));
      if (sameIndex === -1) return [...prev, draft];
      return prev.map((line, i) =>
        i === sameIndex
          ? { ...line, quantity: line.quantity + draft.quantity }
          : line
      );
    });
  };

  // Warns when the cart would take more than the location has in stock.
  const isStockShort = (draft: OrderDraft, index?: number) => {
    const menuItem = menuItems ? getItem(draft.item, menuItems) : undefined;
    if (!menuItem || !menuItemHasDecrementStock(menuItem)) return false;
    const otherLines = drafts
      .filter(
        (line, i) =>
          i !== index &&
          line.item === draft.item &&
          line.stockLocation === draft.stockLocation
      )
      .reduce((sum, line) => sum + line.quantity, 0);
    const stockQuantity = getMenuItemStockQuantity(
      menuItem,
      draft.stockLocation,
      stocks
    );
    return stockQuantity < otherLines + draft.quantity;
  };

  const addDraft = (draft: OrderDraft, index?: number) => {
    if (isStockShort(draft, index)) {
      setPendingAdd({ draft, index });
      return;
    }
    saveDraft(draft, index);
  };

  const changeQuantity = (index: number, delta: number) => {
    const line = drafts[index];
    if (!line) return;
    if (line.quantity + delta < 1) {
      setDrafts((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    addDraft({ ...line, quantity: line.quantity + delta }, index);
  };

  // Takes one back from the latest cart line of the product.
  const removeOneFromCart = (itemId: number) => {
    const index = drafts.map((draft) => draft.item).lastIndexOf(itemId);
    if (index !== -1) changeQuantity(index, -1);
  };

  const missingMessage = (() => {
    if (isCounterUser && !createdBy) return t("Select the order taker");
    if (
      isActivityTable &&
      drafts.some((draft) => !draft.activityTableName || !draft.activityPlayer)
    ) {
      return t("Select the table and player for every product");
    }
    return "";
  })();

  const sendOrder = () => {
    if (!menuItems || !categories || !user || missingMessage) return;
    const orders = drafts
      .map((draft) =>
        buildOrderObject(draft, {
          menuItems,
          categories,
          kitchens,
          table,
          user,
          selectedLocationId,
          createdBy: isCounterUser ? createdBy : undefined,
        })
      )
      .filter((order): order is Partial<Order> => order !== null);
    if (orders.length === 0) return;
    if (orders.length === 1) {
      createOrder(orders[0]);
    } else {
      createMultipleOrder({ orders, table });
    }
    onClose();
  };

  const setActivityDefaults = (changes: {
    tableName?: string;
    player?: string;
  }) => {
    if (changes.tableName !== undefined)
      setActivityTableName(changes.tableName);
    if (changes.player !== undefined) setActivityPlayer(changes.player);
    // Lines added before the choice get it too.
    setDrafts((prev) =>
      prev.map((draft) => ({
        ...draft,
        activityTableName: draft.activityTableName || changes.tableName || "",
        activityPlayer: draft.activityPlayer || changes.player || "",
      }))
    );
  };

  const sheetItem =
    sheet && menuItems ? getItem(sheet.item, menuItems) : undefined;
  const sheetCategory =
    sheetItem && categories
      ? getItem(sheetItem.category, categories)
      : undefined;
  const totalQuantity = drafts.reduce((sum, d) => sum + d.quantity, 0);
  const totalPrice = drafts.reduce((sum, d) => sum + draftPrice(d), 0);
  const cartTitle = `${t("Table")}: ${table.name}`;

  return (
    <div className="__className_a182b8 fixed inset-0 z-50 flex sm:items-center sm:justify-center bg-gray-900/50">
      <div className="relative flex flex-col w-full h-[100dvh] sm:h-[92vh] sm:w-[96%] lg:w-[90%] max-w-6xl bg-white sm:rounded-2xl overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <div className="w-11 h-11 rounded-xl bg-gray-900 text-white grid place-items-center font-bold">
            {table.name}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900">{t("Add Order")}</h2>
            <p className="text-xs text-gray-500 tabular-nums">
              {[
                `${table.playerCount} ${t("people")}`,
                table.startHour,
                isActivityTable && table.tables?.join(", "),
                table.isOnlineSale && t("Online Sales"),
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close")}
            className="ml-auto w-10 h-10 rounded-xl bg-gray-100 grid place-items-center text-gray-600 text-2xl"
          >
            <IoIosClose />
          </button>
        </header>

        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_380px]">
          <section className="relative flex flex-col min-h-0">
            {(isCounterUser || isActivityTable) && (
              <div className="flex flex-col gap-2 px-4 pt-3">
                {isCounterUser && (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <span
                      className={`text-xs font-semibold whitespace-nowrap ${
                        createdBy ? "text-gray-500" : "text-red-600"
                      }`}
                    >
                      {t("Order Taker")}
                    </span>
                    {takerOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={createdBy === option.value}
                        onClick={() => setCreatedBy(option.value)}
                        className={chipClass(createdBy === option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
                {isActivityTable && (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <span
                      className={`text-xs font-semibold whitespace-nowrap ${
                        activityTableName && activityPlayer
                          ? "text-gray-500"
                          : "text-red-600"
                      }`}
                    >
                      {t("Table")}
                    </span>
                    {table.tables?.map((name) => (
                      <button
                        key={name}
                        type="button"
                        aria-pressed={activityTableName === name}
                        onClick={() => setActivityDefaults({ tableName: name })}
                        className={chipClass(activityTableName === name)}
                      >
                        {name}
                      </button>
                    ))}
                    <input
                      aria-label={t("Player Number")}
                      placeholder={t("Player Number")}
                      value={activityPlayer}
                      onChange={(e) => setActivityPlayer(e.target.value)}
                      onBlur={(e) =>
                        setActivityDefaults({ player: e.target.value })
                      }
                      className="w-32 shrink-0 rounded-lg border border-gray-300 px-2 py-1.5 text-base md:text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="px-4 pt-3">
              <label className="flex items-center gap-2 rounded-xl bg-gray-100 px-3 border border-transparent focus-within:border-blue-500">
                <FiSearch className="text-gray-400 shrink-0" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    // A barcode scanner types the code and presses Enter.
                    if (e.key === "Enter" && visibleItems.length === 1) {
                      addDraft(newDraft(visibleItems[0]._id));
                      setSearch("");
                    }
                  }}
                  placeholder={t("Search product, SKU or barcode")}
                  className="flex-1 min-w-0 bg-transparent py-2.5 text-base md:text-sm focus:outline-none"
                />
              </label>
            </div>

            <div
              role="tablist"
              className="flex gap-1.5 overflow-x-auto no-scrollbar px-4 py-3 border-b border-gray-100"
            >
              {popularMenuItems.length > 0 && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={!search && activeCategory === POPULAR}
                  onClick={() => {
                    setSelectedCategory(POPULAR);
                    setSearch("");
                  }}
                  className={chipClass(!search && activeCategory === POPULAR)}
                >
                  {t("Frequently ordered")}
                </button>
              )}
              {categoryChips.map((category) => (
                <button
                  key={category._id}
                  type="button"
                  role="tab"
                  aria-selected={!search && activeCategory === category._id}
                  onClick={() => {
                    setSelectedCategory(category._id);
                    setSearch("");
                  }}
                  className={chipClass(
                    !search && activeCategory === category._id
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-24 md:pb-4">
              {inactiveCategoryNames.length > 0 && (
                <p className="mx-4 mt-3 rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-600">
                  {inactiveCategoryNames
                    .map((name) =>
                      t("{{categoryName}} is not active", {
                        categoryName: name,
                      })
                    )
                    .join(" ")}
                </p>
              )}
              {visibleItems.length === 0 && (
                <p className="px-6 py-12 text-center text-sm text-gray-500">
                  {search
                    ? t("No product matches your search.")
                    : t("No products in this category.")}
                </p>
              )}
              {visibleItems.map((menuItem) => {
                const category = categories
                  ? getItem(menuItem.category, categories)
                  : undefined;
                const subText = menuItems
                  ? getMenuItemSubText(menuItem, category, menuItems)
                  : undefined;
                const count = quantityInCart(menuItem._id);
                const stockQuantity = listStockQuantity(menuItem);
                return (
                  <div
                    key={menuItem._id}
                    className={`flex items-center gap-3 px-4 py-2.5 ${
                      count ? "bg-blue-50/60" : "hover:bg-gray-50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => addDraft(newDraft(menuItem._id))}
                      className="flex-1 min-w-0 flex items-center gap-3 text-left active:opacity-70"
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold text-gray-900">
                          {menuItem.name}
                        </span>
                        {subText && (
                          <span className="block text-xs text-gray-500">
                            {subText.split("|||").join(", ")}
                          </span>
                        )}
                        {stockQuantity !== null && (
                          <span
                            className={`block text-xs tabular-nums ${
                              stockQuantity <= 0
                                ? "text-red-600 font-semibold"
                                : "text-gray-500"
                            }`}
                          >
                            {stockQuantity <= 0
                              ? t("Out of stock")
                              : `${t("Stock")}: ${stockQuantity}`}
                          </span>
                        )}
                      </span>
                      <span className="text-right font-semibold text-gray-900 tabular-nums">
                        {menuItem.price} {TURKISHLIRA}
                        {category?.isOnlineOrder &&
                          menuItem.onlinePrice !== undefined && (
                            <span className="block text-xs font-normal text-gray-500">
                              {t("Online")}: {menuItem.onlinePrice}{" "}
                              {TURKISHLIRA}
                            </span>
                          )}
                      </span>
                    </button>
                    {count > 0 && (
                      <button
                        type="button"
                        onClick={() => removeOneFromCart(menuItem._id)}
                        aria-label={`${menuItem.name}: ${t("Decrease")}`}
                        className="w-10 h-10 shrink-0 rounded-xl bg-gray-100 grid place-items-center text-gray-700 active:scale-95"
                      >
                        <FiMinus />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => addDraft(newDraft(menuItem._id))}
                      aria-label={`${menuItem.name}: ${t("Increase")}`}
                      className={`w-10 h-10 shrink-0 rounded-xl grid place-items-center font-bold tabular-nums active:scale-95 ${
                        count
                          ? "bg-blue-600 text-white"
                          : "bg-blue-50 text-blue-600 text-xl"
                      }`}
                    >
                      {count || "+"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSheet({ item: menuItem._id })}
                      aria-label={`${menuItem.name}: ${t("Options")}`}
                      title={t("Options")}
                      className="w-9 h-10 shrink-0 rounded-lg grid place-items-center text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <FiMoreHorizontal />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="md:hidden absolute left-3 right-3 bottom-3 h-14 rounded-2xl bg-gray-900 text-white flex items-center gap-3 pl-2 pr-2 shadow-lg">
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="flex-1 min-w-0 h-full flex items-center gap-3 text-left"
              >
                <span className="w-9 h-9 rounded-lg bg-white text-gray-900 grid place-items-center font-bold tabular-nums">
                  {totalQuantity}
                </span>
                <span className="leading-tight">
                  <span className="block font-semibold tabular-nums">
                    {totalQuantity
                      ? `${totalPrice} ${TURKISHLIRA}`
                      : t("Order list")}
                  </span>
                  <span className="block text-xs text-gray-300">
                    {t("Open the order list")}
                  </span>
                </span>
              </button>
              {drafts.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    missingMessage ? setIsCartOpen(true) : sendOrder()
                  }
                  className="h-10 px-4 rounded-xl bg-blue-600 font-semibold"
                >
                  {missingMessage ? t("Missing info") : t("Send")}
                </button>
              )}
            </div>
          </section>

          <aside
            className={`${
              isCartOpen ? "flex absolute inset-0 z-20" : "hidden"
            } md:static md:flex flex-col min-h-0 md:border-l md:border-gray-100`}
          >
            <OrderComposerCart
              title={cartTitle}
              tableId={table._id}
              tableOrders={tableOrders}
              drafts={drafts}
              menuItems={menuItems}
              stockLocations={stockLocations}
              orderNotes={orderNotes}
              isActivityTable={isActivityTable}
              tab={cartTab}
              setTab={setCartTab}
              draftPrice={draftPrice}
              totalQuantity={totalQuantity}
              totalPrice={totalPrice}
              missingMessage={missingMessage}
              onChangeQuantity={changeQuantity}
              onEdit={(index) => setSheet({ item: drafts[index].item, index })}
              onToggleServed={(index) =>
                setDrafts((prev) =>
                  prev.map((line, i) =>
                    i === index ? { ...line, isServed: !line.isServed } : line
                  )
                )
              }
              onDelete={(index) =>
                setDrafts((prev) => prev.filter((_, i) => i !== index))
              }
              onToggleAllServed={() => {
                const isServed = !drafts.every((draft) => draft.isServed);
                setDrafts((prev) =>
                  prev.map((line) => ({ ...line, isServed }))
                );
              }}
              onSend={sendOrder}
              onCloseMobile={() => setIsCartOpen(false)}
            />
          </aside>
        </div>

        {sheet && sheetItem && (
          <OrderItemSheet
            menuItem={sheetItem}
            category={sheetCategory}
            kitchenName={
              sheetCategory && kitchens
                ? getItem(sheetCategory.kitchen, kitchens)?.name
                : undefined
            }
            initialDraft={
              sheet.index !== undefined
                ? drafts[sheet.index]
                : newDraft(sheetItem._id)
            }
            isEdit={sheet.index !== undefined}
            orderNotes={orderNotes}
            stockLocations={stockLocations}
            stocks={stocks}
            products={products}
            isActivityTable={isActivityTable}
            activityTableNames={table.tables ?? []}
            onSave={(draft) => {
              addDraft(draft, sheet.index);
              setSheet(null);
            }}
            onClose={() => setSheet(null)}
          />
        )}
      </div>

      <ConfirmationDialog
        isOpen={pendingAdd !== null}
        close={() => setPendingAdd(null)}
        confirm={() => {
          if (pendingAdd) saveDraft(pendingAdd.draft, pendingAdd.index);
          setPendingAdd(null);
        }}
        title={t("Stock Quantity Warning")}
        text={t("Stock Quantity is not enough. Do you want to continue?")}
      />
    </div>
  );
};

export default OrderComposer;
