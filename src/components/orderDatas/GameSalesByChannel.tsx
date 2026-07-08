import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../context/Order.context";
import { useUserContext } from "../../context/User.context";
import {
  ActionEnum,
  DateRangeKey,
  DisabledConditionEnum,
  Order,
  OrderStatus,
  TURKISHLIRA,
  commonDateOptions,
  orderFilterStatusOptions,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { Paths } from "../../utils/api/factory";
import { useGetSellLocations } from "../../utils/api/location";
import { useGetAllCategories } from "../../utils/api/menu/category";
import { useGetAllMenuItems } from "../../utils/api/menu/menu-item";
import { useGetOrders } from "../../utils/api/order/order";
import { useGetAllOrderCollections } from "../../utils/api/order/orderCollection";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { formatCurrency, formatPercentage } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { isActionDisabled } from "../../utils/permissions";
import { QuickDateRangeFilter } from "../common/QuickDateRangeFilter";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

enum Channel {
  STORE = "store",
  PICKUP = "pickup",
  SHOPIFY_SHIPPED = "shopify_shipped",
  TRENDYOL = "trendyol",
  HEPSIBURADA = "hepsiburada",
  RETAILER = "retailer",
}

const channelLabels: Record<Channel, string> = {
  [Channel.STORE]: "Store",
  [Channel.PICKUP]: "Shopify Pick Up",
  [Channel.SHOPIFY_SHIPPED]: "Shopify Shipped",
  [Channel.TRENDYOL]: "Trendyol",
  [Channel.HEPSIBURADA]: "Hepsiburada",
  [Channel.RETAILER]: "Retailer (Wholesale)",
};

const channelOrder = [
  Channel.STORE,
  Channel.PICKUP,
  Channel.SHOPIFY_SHIPPED,
  Channel.TRENDYOL,
  Channel.HEPSIBURADA,
  Channel.RETAILER,
];

function getChannel(order: Order, retailerId?: number): Channel {
  if (retailerId) return Channel.RETAILER;
  if (order?.shopifyOrderId) {
    return order?.isShopifyPickUp ? Channel.PICKUP : Channel.SHOPIFY_SHIPPED;
  }
  if (order?.trendyolOrderId) return Channel.TRENDYOL;
  if (order?.hepsiburadaOrderNumber) return Channel.HEPSIBURADA;
  return Channel.STORE;
}

type CategoryBreakdownRow = {
  categoryId: number;
  category: string;
  quantity: number;
  amount: number;
};

type ChannelRow = {
  channel?: Channel;
  channelLabel: string;
  totalQuantity: number;
  totalAmount: number;
  ratioToTotal?: number;
  className?: string;
  isSortable?: boolean;
  categoryTotals: Map<number, { quantity: number; amount: number }>;
  collapsible?: {
    collapsibleHeader: string;
    collapsibleColumns: { key: string; isSortable: boolean }[];
    collapsibleRows: CategoryBreakdownRow[];
    collapsibleRowKeys: { key: string; node?: (row: any) => JSX.Element }[];
  };
};

const GameSalesByChannel = () => {
  const { t } = useTranslation();
  const categories = useGetAllCategories();
  const items = useGetAllMenuItems();
  const sellLocations = useGetSellLocations();
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();

  const gameCategoryIds = useMemo(() => {
    return (
      categories
        ?.filter((category) => category.isGameSalesReport)
        ?.map((category) => category._id) ?? []
    );
  }, [categories]);

  // Disabled until game categories are known — never falls back to an
  // unfiltered "fetch every order" request while categories are loading
  // or if no category has the isGameSalesReport flag set.
  const orders = useGetOrders(gameCategoryIds, gameCategoryIds.length > 0);

  // Order.retailer is never populated by the app — retailer tagging happens
  // on OrderCollection ("Add To Retailer" in Collections/ShopifyCollections).
  // Fetch collections (same date/location filter as orders) to resolve it.
  const collections = useGetAllOrderCollections();

  const orderRetailerMap = useMemo(() => {
    const map = new Map<number, number>();
    collections?.forEach((collection) => {
      if (!collection.retailer) return;
      collection.orders?.forEach((orderItem) => {
        const orderId =
          typeof orderItem.order === "number"
            ? orderItem.order
            : orderItem.order?._id;
        if (orderId !== undefined) {
          map.set(orderId, collection.retailer as number);
        }
      });
    });
    return map;
  }, [collections]);

  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
    showOrderDataFilters,
    setShowOrderDataFilters,
  } = useOrderContext();

  const gameSalesByChannelDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.ORDERDATAS_GAMESALESBYCHANNEL,
      disabledConditions
    );
  }, [disabledConditions]);

  const buildCollapsible = (categoryTotals: Map<number, { quantity: number; amount: number }>) => ({
    collapsibleHeader: t("Categories"),
    collapsibleColumns: [
      { key: t("Category"), isSortable: false },
      { key: t("Product Count"), isSortable: false },
      { key: t("Amount"), isSortable: false },
    ],
    collapsibleRows: gameCategoryIds.map((categoryId) => ({
      categoryId,
      category: getItem(categoryId, categories)?.name ?? "",
      quantity: categoryTotals.get(categoryId)?.quantity ?? 0,
      amount: categoryTotals.get(categoryId)?.amount ?? 0,
    })),
    collapsibleRowKeys: [
      { key: "category" },
      { key: "quantity" },
      {
        key: "amount",
        node: (row: CategoryBreakdownRow) => (
          <p key={row.categoryId + "amount"}>
            {formatCurrency(row.amount)} {TURKISHLIRA}
          </p>
        ),
      },
    ],
  });

  const itemsById = useMemo(() => {
    const map = new Map<number, (typeof items)[number]>();
    items?.forEach((item) => map.set(item._id, item));
    return map;
  }, [items]);

  const gameCategoryIdSet = useMemo(
    () => new Set(gameCategoryIds),
    [gameCategoryIds]
  );

  const rows = useMemo(() => {
    if (!orders || !items || gameCategoryIds.length === 0) return [];

    const groups = new Map<Channel, ChannelRow>(
      channelOrder.map((channel) => [
        channel,
        {
          channel,
          channelLabel: t(channelLabels[channel]),
          totalQuantity: 0,
          totalAmount: 0,
          categoryTotals: new Map(),
        },
      ])
    );

    orders?.forEach((order) => {
      if (
        [OrderStatus.CANCELLED, OrderStatus.RETURNED].includes(
          order.status as OrderStatus
        ) ||
        !(order?.paidQuantity > 0)
      ) {
        return;
      }

      const categoryId = itemsById.get(order?.item)?.category ?? -1;
      if (!gameCategoryIdSet.has(categoryId)) return;

      const channel = getChannel(order, orderRetailerMap.get(order._id));
      const amount = order.quantity * order.unitPrice;

      const entry = groups.get(channel) as ChannelRow;
      const categoryEntry = entry.categoryTotals.get(categoryId) ?? {
        quantity: 0,
        amount: 0,
      };
      categoryEntry.quantity += order.quantity;
      categoryEntry.amount += amount;
      entry.categoryTotals.set(categoryId, categoryEntry);

      entry.totalQuantity += order.quantity;
      entry.totalAmount += amount;
    });

    const allRows = channelOrder.map(
      (channel) => groups.get(channel) as ChannelRow
    );

    const grandTotal = allRows.reduce((acc, row) => acc + row.totalAmount, 0);

    const allRowsWithRatio: ChannelRow[] = allRows.map((row) => ({
      ...row,
      ratioToTotal: grandTotal > 0 ? (row.totalAmount / grandTotal) * 100 : 0,
      collapsible: buildCollapsible(row.categoryTotals),
    }));

    const totalCategoryTotals = new Map<
      number,
      { quantity: number; amount: number }
    >();
    let totalQuantity = 0;
    let totalAmount = 0;
    allRowsWithRatio.forEach((row) => {
      totalQuantity += row.totalQuantity;
      totalAmount += row.totalAmount;
      row.categoryTotals.forEach((value, categoryId) => {
        const acc = totalCategoryTotals.get(categoryId) ?? {
          quantity: 0,
          amount: 0,
        };
        acc.quantity += value.quantity;
        acc.amount += value.amount;
        totalCategoryTotals.set(categoryId, acc);
      });
    });

    allRowsWithRatio.unshift({
      channel: undefined,
      channelLabel: t("Total"),
      className: "font-semibold",
      isSortable: false,
      ratioToTotal: 100,
      totalQuantity,
      totalAmount,
      categoryTotals: totalCategoryTotals,
      collapsible: buildCollapsible(totalCategoryTotals),
    });

    return allRowsWithRatio;
  }, [
    orders,
    items,
    itemsById,
    gameCategoryIdSet,
    gameCategoryIds,
    orderRetailerMap,
    t,
  ]);

  const columns = useMemo(
    () => [
      { key: t("Channel"), isSortable: true, correspondingKey: "channelLabel" },
      {
        key: t("Total Quantity"),
        isSortable: true,
        correspondingKey: "totalQuantity",
      },
      {
        key: t("Total Amount"),
        isSortable: true,
        correspondingKey: "totalAmount",
      },
      {
        key: t("Ratio to Total"),
        isSortable: true,
        correspondingKey: "ratioToTotal",
      },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "channelLabel",
        className: "min-w-40 pr-2",
        node: (row: ChannelRow) => (
          <p className={`${row?.className}`}>{row?.channelLabel}</p>
        ),
      },
      { key: "totalQuantity" },
      {
        key: "totalAmount",
        node: (row: ChannelRow) => (
          <p className={`${row?.className}`}>
            {formatCurrency(row?.totalAmount ?? 0)} {TURKISHLIRA}
          </p>
        ),
      },
      {
        key: "ratioToTotal",
        node: (row: ChannelRow) => (
          <p className={`${row?.className}`}>
            {row?.ratioToTotal !== undefined &&
              formatPercentage(row.ratioToTotal)}
          </p>
        ),
      },
    ],
    []
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: sellLocations.map((input) => ({
          value: input._id,
          label: input.name,
        })),
        placeholder: t("Location"),
        required: true,
        isMultiple: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "date",
        label: t("Date"),
        options: commonDateOptions.map((option) => ({
          value: option.value,
          label: t(option.label),
        })),
        placeholder: t("Date"),
        required: true,
        additionalOnChange: ({ value }: { value: string }) => {
          const dateRange = dateRanges[value as DateRangeKey];
          if (dateRange) {
            setFilterPanelFormElements({
              ...filterPanelFormElements,
              ...dateRange(),
            });
          }
        },
      },
      {
        type: InputTypes.DATE,
        formKey: "after",
        label: t("Start Date"),
        placeholder: t("Start Date"),
        required: true,
        isDatePicker: true,
        invalidateKeys: [{ key: "date", defaultValue: "" }],
        isOnClearActive: false,
      },
      {
        type: InputTypes.DATE,
        formKey: "before",
        label: t("End Date"),
        placeholder: t("End Date"),
        required: true,
        isDatePicker: true,
        invalidateKeys: [{ key: "date", defaultValue: "" }],
        isOnClearActive: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "status",
        label: t("Status"),
        options: orderFilterStatusOptions.map((option) => ({
          value: option.value,
          label: t(option.label),
        })),
        placeholder: t("Status"),
        required: true,
      },
    ],
    [sellLocations, t, filterPanelFormElements, setFilterPanelFormElements]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showOrderDataFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      additionalFilterCleanFunction: () => {
        setFilterPanelFormElements(initialFilterPanelFormElements);
      },
      closeFilters: () => setShowOrderDataFilters(false),
    }),
    [
      showOrderDataFilters,
      filterPanelInputs,
      filterPanelFormElements,
      setFilterPanelFormElements,
      initialFilterPanelFormElements,
      setShowOrderDataFilters,
    ]
  );

  const filters = useMemo(
    () => [
      {
        isUpperSide: true,
        node: (
          <QuickDateRangeFilter
            startDate={filterPanelFormElements.after}
            endDate={filterPanelFormElements.before}
            onChange={(start: string, end: string) => {
              const isReset = !start && !end;
              setFilterPanelFormElements({
                ...filterPanelFormElements,
                after: isReset ? initialFilterPanelFormElements.after : start,
                before: isReset ? "" : end,
                date: "",
              });
            }}
          />
        ),
      },
      {
        isUpperSide: false,
        node: (
          <ButtonFilter
            buttonName={t("Refresh Data")}
            onclick={() => {
              queryClient.invalidateQueries({
                queryKey: [`${Paths.Order}/query`],
              });
              queryClient.invalidateQueries({
                queryKey: [`${Paths.Order}/collection/query`],
              });
            }}
          />
        ),
        isDisabled: isActionDisabled(
          gameSalesByChannelDisabledCondition,
          ActionEnum.REFRESH,
          user
        ),
      },
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showOrderDataFilters}
            onChange={() => setShowOrderDataFilters(!showOrderDataFilters)}
          />
        ),
      },
    ],
    [
      t,
      queryClient,
      gameSalesByChannelDisabledCondition,
      user,
      showOrderDataFilters,
      setShowOrderDataFilters,
      filterPanelFormElements,
      initialFilterPanelFormElements,
      setFilterPanelFormElements,
    ]
  );

  return (
    <div className="w-[95%] mx-auto mb-auto">
      <p className="mb-2 text-sm text-gray-500">
        {t("GameSalesByChannel Info Text")}
      </p>
      <GenericTable
        title={t("Game Sales by Channel")}
        columns={columns}
        rowKeys={rowKeys}
        rows={rows}
        filters={filters}
        filterPanel={filterPanel}
        isActionsActive={false}
        isExcel={
          !isActionDisabled(
            gameSalesByChannelDisabledCondition,
            ActionEnum.EXCEL,
            user
          )
        }
        excelFileName={t("GameSalesByChannel.xlsx")}
        isCollapsible={true}
      />
    </div>
  );
};

export default GameSalesByChannel;
