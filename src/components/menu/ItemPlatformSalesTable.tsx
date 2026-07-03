import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import {
  ActionEnum,
  DisabledConditionEnum,
  ItemPlatformKey,
  ItemPlatformOrder,
  MenuItem,
  RowPerPageEnum,
  TURKISHLIRA,
} from "../../types";
import {
  useGetItemPlatformOrders,
  useGetItemPlatformSummary,
} from "../../utils/api/order/order";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { formatCurrency, toIstDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { isActionDisabled } from "../../utils/permissions";
import GenericTable from "../panelComponents/Tables/GenericTable";

const PLATFORMS: { key: ItemPlatformKey; label: string }[] = [
  { key: "shopify", label: "Shopify" },
  { key: "trendyol", label: "Trendyol" },
  { key: "hepsiburada", label: "Hepsiburada" },
];

const ORDER_NUMBER_KEY: Record<ItemPlatformKey, keyof ItemPlatformOrder> = {
  shopify: "shopifyOrderNumber",
  trendyol: "trendyolOrderNumber",
  hepsiburada: "hepsiburadaOrderNumber",
};

type PlatformOrderRow = {
  _id: string;
  dateDisplay: string;
  orderNumberDisplay: string;
  quantityDisplay: number | string;
  unitPriceDisplay: string;
  statusDisplay: string;
  isLoadMore?: boolean;
};

type PlatformSummaryRow = {
  _id: ItemPlatformKey;
  platformLabel: string;
  totalQuantityDisplay: number;
  orderCountDisplay: number;
  collapsible: {
    collapsibleColumns: { key: string; isSortable: boolean }[];
    collapsibleRows: PlatformOrderRow[];
    collapsibleRowKeys: {
      key: string;
      node?: (row: PlatformOrderRow) => React.ReactNode;
      className?: string;
    }[];
  };
};

type Props = {
  item?: MenuItem;
};

export default function ItemPlatformSalesTable({ item }: Props) {
  const { t } = useTranslation();
  const {
    expandedRows,
    setExpandedRows,
    rowsPerPage,
    setRowsPerPage,
  } = useGeneralContext();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();
  const itemId = item?._id;

  // this table doesn't paginate (isPagination/isRowsPerPage=false), but GenericTable
  // still sizes its scroll container off the shared global rowsPerPage, which can be
  // left at a large value (e.g. "All") from the user's profile settings - force it
  // down while this table is mounted so it doesn't reserve a huge fixed height
  useEffect(() => {
    const prev = rowsPerPage;
    if (rowsPerPage > RowPerPageEnum.THIRD) setRowsPerPage(RowPerPageEnum.THIRD);
    return () => setRowsPerPage(prev);
  }, []); // eslint-disable-line

  const itemPageDisabledCondition = useMemo(
    () => getItem(DisabledConditionEnum.ITEMPAGE, disabledConditions),
    [disabledConditions]
  );

  const isTableVisible = !isActionDisabled(
    itemPageDisabledCondition,
    ActionEnum.SHOW_INNER_DATAS,
    user
  );

  const availablePlatforms = useMemo(
    () =>
      isTableVisible
        ? PLATFORMS.filter((platform) => {
            if (platform.key === "shopify") return Boolean(item?.shopifyId);
            if (platform.key === "trendyol")
              return (
                Boolean(item?.trendyolBarcode) || Boolean(item?.trendyolSku)
              );
            if (platform.key === "hepsiburada")
              return Boolean(item?.hepsiBuradaSku);
            return false;
          })
        : [],
    [item, isTableVisible]
  );

  const summary = useGetItemPlatformSummary(
    availablePlatforms.length > 0 ? itemId : undefined
  );

  const [requested, setRequested] = useState<Record<ItemPlatformKey, boolean>>(
    { shopify: false, trendyol: false, hepsiburada: false }
  );
  const [pages, setPages] = useState<Record<ItemPlatformKey, number>>({
    shopify: 1,
    trendyol: 1,
    hepsiburada: 1,
  });
  const [ordersByPlatform, setOrdersByPlatform] = useState<
    Record<ItemPlatformKey, ItemPlatformOrder[]>
  >({ shopify: [], trendyol: [], hepsiburada: [] });
  const [hasMoreByPlatform, setHasMoreByPlatform] = useState<
    Record<ItemPlatformKey, boolean>
  >({ shopify: false, trendyol: false, hepsiburada: false });

  // reset local pagination/collapsible state when navigating to a different item
  useEffect(() => {
    setExpandedRows({});
    setRequested({ shopify: false, trendyol: false, hepsiburada: false });
    setPages({ shopify: 1, trendyol: 1, hepsiburada: 1 });
    setOrdersByPlatform({ shopify: [], trendyol: [], hepsiburada: [] });
    setHasMoreByPlatform({ shopify: false, trendyol: false, hepsiburada: false });
  }, [itemId]); // eslint-disable-line

  useEffect(() => {
    availablePlatforms.forEach((platform, index) => {
      if (expandedRows[`row-${index}`] && !requested[platform.key]) {
        setRequested((prev) => ({ ...prev, [platform.key]: true }));
      }
    });
  }, [expandedRows, requested, availablePlatforms]);

  const shopifyData = useGetItemPlatformOrders(
    itemId,
    "shopify",
    pages.shopify,
    requested.shopify
  );
  const trendyolData = useGetItemPlatformOrders(
    itemId,
    "trendyol",
    pages.trendyol,
    requested.trendyol
  );
  const hepsiburadaData = useGetItemPlatformOrders(
    itemId,
    "hepsiburada",
    pages.hepsiburada,
    requested.hepsiburada
  );

  const platformData: Record<ItemPlatformKey, typeof shopifyData> = {
    shopify: shopifyData,
    trendyol: trendyolData,
    hepsiburada: hepsiburadaData,
  };

  useEffect(() => {
    (["shopify", "trendyol", "hepsiburada"] as ItemPlatformKey[]).forEach(
      (platform) => {
        const data = platformData[platform];
        if (!data) return;
        setOrdersByPlatform((prev) => {
          if (data.page === 1) {
            return { ...prev, [platform]: data.orders };
          }
          const existingIds = new Set(prev[platform].map((order) => order._id));
          return {
            ...prev,
            [platform]: [
              ...prev[platform],
              ...data.orders.filter((order) => !existingIds.has(order._id)),
            ],
          };
        });
        setHasMoreByPlatform((prev) => ({ ...prev, [platform]: data.hasMore }));
      }
    );
  }, [shopifyData, trendyolData, hepsiburadaData]); // eslint-disable-line

  const rows: PlatformSummaryRow[] = useMemo(
    () =>
      availablePlatforms.map((platform) => {
        const orders = ordersByPlatform[platform.key];
        const collapsibleRows: PlatformOrderRow[] = orders.map((order) => ({
          _id: String(order._id),
          dateDisplay: format(toIstDate(order.createdAt), "dd/MM/yyyy HH:mm"),
          orderNumberDisplay:
            (order[ORDER_NUMBER_KEY[platform.key]] as string) || "-",
          quantityDisplay: order.quantity,
          unitPriceDisplay: `${formatCurrency(order.unitPrice)} ${TURKISHLIRA}`,
          statusDisplay: order.status,
        }));

        if (hasMoreByPlatform[platform.key]) {
          collapsibleRows.push({
            _id: `${platform.key}-load-more`,
            dateDisplay: "",
            orderNumberDisplay: "",
            quantityDisplay: "",
            unitPriceDisplay: "",
            statusDisplay: "",
            isLoadMore: true,
          });
        }

        const dateOrLoadMoreNode = (row: PlatformOrderRow) => {
          if (!row.isLoadMore) return row.dateDisplay;
          return (
            <button
              className="text-blue-600 hover:underline text-sm"
              onClick={(event) => {
                event.stopPropagation();
                setPages((prev) => ({
                  ...prev,
                  [platform.key]: prev[platform.key] + 1,
                }));
              }}
            >
              {t("Load More")}
            </button>
          );
        };

        return {
          _id: platform.key,
          platformLabel: platform.label,
          totalQuantityDisplay: summary?.[platform.key]?.totalQuantity ?? 0,
          orderCountDisplay: summary?.[platform.key]?.orderCount ?? 0,
          collapsible: {
            collapsibleColumns: [
              { key: t("Date"), isSortable: false },
              { key: t("Order Number"), isSortable: false },
              { key: t("Quantity"), isSortable: false },
              { key: t("Status"), isSortable: false },
            ],
            collapsibleRows,
            collapsibleRowKeys: [
              {
                key: "dateDisplay",
                node: dateOrLoadMoreNode,
                className: "min-w-32",
              },
              { key: "orderNumberDisplay", className: "min-w-32" },
              { key: "quantityDisplay", className: "min-w-20" },
              { key: "statusDisplay", className: "min-w-24" },
            ],
          },
        };
      }),
    [summary, ordersByPlatform, hasMoreByPlatform, t, availablePlatforms]
  );

  const columns = useMemo(
    () => [
      { key: t("Platform"), isSortable: false },
      { key: t("Sold Quantity"), isSortable: false },
      { key: t("Order Count"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "platformLabel", className: "min-w-32 font-medium" },
      { key: "totalQuantityDisplay", className: "min-w-32" },
      { key: "orderCountDisplay", className: "min-w-32" },
    ],
    []
  );

  if (!itemId || availablePlatforms.length === 0) return null;

  return (
    <GenericTable<PlatformSummaryRow>
      title={t("Platform Sales")}
      rows={rows}
      columns={columns}
      rowKeys={rowKeys}
      isActionsActive={false}
      isCollapsible={true}
      isCollapsibleCheckActive={false}
      isSearch={false}
      isColumnFilter={false}
      isPagination={false}
      isRowsPerPage={false}
      isExcel={false}
    />
  );
}
