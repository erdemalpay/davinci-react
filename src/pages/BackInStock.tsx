import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import {
  ColumnType,
  InputTypes,
} from "../components/panelComponents/shared/types";
import { useGeneralContext } from "../context/General.context";
import { MenuItem } from "../types";
import {
  useGetAccountStocks,
  useNotifyBackInStockSubscribersBulkMutation,
  useNotifyBackInStockSubscribersMutation,
} from "../utils/api/account/stock";
import {
  BackInStockQueryParams,
  BackInStockSubscription,
  SubscriptionStatus,
  useGetBackInStockSubscriptions,
} from "../utils/api/backInStock";
import { useGetMenuItems } from "../utils/api/menu/menu-item";
import { formatAsLocalDate } from "../utils/format";

type FormElementsState = {
  [key: string]: string | number | boolean | null | undefined;
} & BackInStockQueryParams;

type BackInStockSubscriptionRow = BackInStockSubscription & {
  matchedProductId?: string;
  totalStock?: number;
};

type BackInStockRow = BackInStockSubscriptionRow & {
  requestCount?: number;
  productTitle: string;
  collapsible?: {
    collapsibleHeader: string;
    collapsibleColumns: { key: string; isSortable?: boolean }[];
    collapsibleRows: BackInStockSubscriptionRow[];
    collapsibleRowKeys: Array<{
      key: string;
      node?: (row: BackInStockSubscriptionRow) => ReactNode;
    }>;
  };
};

export default function BackInStock() {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const { mutate: notifyBackInStockSubscribers } =
    useNotifyBackInStockSubscribersMutation();
  const { mutate: notifyBackInStockSubscribersBulk } =
    useNotifyBackInStockSubscribersBulkMutation();
  const items = useGetMenuItems();
  const shopifyMenuItems = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => item.shopifyId);
  }, [items]);
  const { selectedRows, setSelectedRows, setIsSelectionActive } =
    useGeneralContext();
  const initialFormElementsState: FormElementsState = {
    email: "",
    status: SubscriptionStatus.ACTIVE,
    productId: "",
    after: "",
    before: "",
    sort: "createdAt",
    asc: -1,
  };
  const stocks = useGetAccountStocks();
  const getProductTotalStock = (productId: string) => {
    if (!stocks) return 0;
    const productStock = stocks
      ?.filter((stock) => stock.product === productId)
      .reduce((total, stock) => total + stock.quantity, 0);
    return productStock || 0;
  };
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFormElementsState);

  const subscriptions = useGetBackInStockSubscriptions(filterPanelFormElements);

  // Group subscriptions by productTitle
  const groupedByProduct = useMemo(() => {
    if (!subscriptions) return new Map<string, BackInStockSubscription[]>();
    const grouped = new Map<string, BackInStockSubscription[]>();

    subscriptions.forEach((subscription) => {
      const groupKey = subscription.productTitle || subscription.productId;
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      grouped.get(groupKey)?.push(subscription);
    });

    return grouped;
  }, [subscriptions]);

  // Helper function to create collapsible row structure
  const createCollapsibleRow = (
    subscriptions: BackInStockSubscription[],
    mainKey: string,
    mainValue: string
  ) => {
    const sortedSubscriptions = [...subscriptions].sort((a, b) => {
      const dateA = new Date(a.subscribedAt).getTime();
      const dateB = new Date(b.subscribedAt).getTime();
      return dateB - dateA;
    });

    const subscriptionsWithStock: BackInStockSubscriptionRow[] =
      sortedSubscriptions.map((subscription) => {
        const matchedProductId = (subscription.menuItemId as MenuItem)
          ?.matchedProduct;
        return {
          ...subscription,
          matchedProductId,
          totalStock: matchedProductId
            ? getProductTotalStock(matchedProductId)
            : 0,
        };
      });

    const representativeSubscription =
      subscriptionsWithStock.find((s) => s.menuItemId) ??
      subscriptionsWithStock[0];

    // Count only ACTIVE subscriptions
    const activeCount = subscriptionsWithStock.filter(
      (s) => s.status === SubscriptionStatus.ACTIVE
    ).length;

    return {
      ...representativeSubscription,
      [mainKey]: mainValue,
      requestCount: activeCount,
      totalStock: representativeSubscription?.totalStock ?? 0,
      collapsible: {
        collapsibleHeader: t("Subscriptions for {{name}}", { name: mainValue }),
        collapsibleColumns: [
          { key: t("Email"), isSortable: true },
          { key: t("Product"), isSortable: true },
          { key: t("Status"), isSortable: true },
          { key: t("Subscribed At"), isSortable: true },
          { key: t("Notified At"), isSortable: true },
          { key: t("Cancelled At"), isSortable: true },
        ],
        collapsibleRows: subscriptionsWithStock,
        collapsibleRowKeys: [
          { key: "email" },
          { key: "productTitle" },
          {
            key: "status",
            node: (row: BackInStockSubscriptionRow) => {
              const statusColors = {
                [SubscriptionStatus.ACTIVE]: "bg-green-500",
                [SubscriptionStatus.NOTIFIED]: "bg-blue-500",
                [SubscriptionStatus.CANCELLED]: "bg-red-500",
              };
              return (
                <span
                  className={`${
                    statusColors[row.status as SubscriptionStatus]
                  } w-fit px-2 py-1 rounded-md text-white`}
                >
                  {row.status}
                </span>
              );
            },
          },
          {
            key: "subscribedAt",
            node: (row: BackInStockSubscriptionRow) =>
              formatAsLocalDate(new Date(row.subscribedAt).toISOString()),
          },
          {
            key: "notifiedAt",
            node: (row: BackInStockSubscriptionRow) =>
              row.notifiedAt
                ? formatAsLocalDate(new Date(row.notifiedAt).toISOString())
                : "-",
          },
          {
            key: "cancelledAt",
            node: (row: BackInStockSubscriptionRow) =>
              row.cancelledAt
                ? formatAsLocalDate(new Date(row.cancelledAt).toISOString())
                : "-",
          },
        ],
      },
    };
  };

  // Process rows - always group by productTitle
  const rows = useMemo<BackInStockRow[]>(() => {
    if (!subscriptions) return [];

    const result: BackInStockRow[] = [];

    groupedByProduct.forEach((subscriptions, productTitle) => {
      if (subscriptions.length === 0) return;

      const mainRow = createCollapsibleRow(
        subscriptions,
        "productTitle",
        productTitle
      );
      result.push(mainRow);
    });

    return result.sort((a, b) => (b.totalStock ?? 0) - (a.totalStock ?? 0));
  }, [subscriptions, groupedByProduct, t, items, stocks]);
  const columns = useMemo(
    () => [
      {
        key: t("Product"),
        isSortable: true,
        correspondingKey: "productTitle",
      },
      {
        key: t("Total Stock"),
        isSortable: true,
        correspondingKey: "totalStock",
      },
      {
        key: t("Request Count"),
        isSortable: true,
        correspondingKey: "requestCount",
      },
      {
        key: t("Actions"),
      },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "productTitle",
        className: "min-w-48",
      },
      {
        key: "totalStock",
        className: "min-w-24",
        node: (row: BackInStockRow) => {
          return (
            <span className="font-medium text-gray-700">
              {row.totalStock ?? 0}
            </span>
          );
        },
      },
      {
        key: "requestCount",
        className: "min-w-24",
        node: (row: BackInStockRow) => {
          return (
            <span className="font-medium text-gray-700">
              {row.requestCount || 0}
            </span>
          );
        },
      },
    ],
    []
  );

  const actions = useMemo(
    () => [
      {
        name: t("Notify Subscribers"),
        isModal: false,
        isPath: false,
        icon: null,
        node: (row: BackInStockRow) => (
          <button
            onClick={() => {
              if (row.menuItemId) {
                notifyBackInStockSubscribers(row.menuItemId as number);
              }
            }}
            className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
          >
            {t("Notify")}
          </button>
        ),
      },
    ],
    [t, notifyBackInStockSubscribers]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "email",
        label: t("Email"),
        placeholder: t("Email"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "productId",
        label: t("Product"),
        placeholder: t("Product"),
        required: false,
        options: shopifyMenuItems.map((item) => ({
          value: item.shopifyId || "",
          label: item.name,
        })),
      },
      {
        type: InputTypes.SELECT,
        formKey: "status",
        label: t("Status"),
        placeholder: t("Status"),
        required: false,
        options: [
          { value: "", label: t("All") },
          { value: SubscriptionStatus.ACTIVE, label: t("Active") },
          { value: SubscriptionStatus.NOTIFIED, label: t("Notified") },
          { value: SubscriptionStatus.CANCELLED, label: t("Cancelled") },
        ],
      },
      {
        type: InputTypes.DATE,
        formKey: "after",
        label: t("Start Date"),
        placeholder: t("Start Date"),
        required: false,
        isDatePicker: true,
      },
      {
        type: InputTypes.DATE,
        formKey: "before",
        label: t("End Date"),
        placeholder: t("End Date"),
        required: false,
        isDatePicker: true,
      },
    ],
    [t]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      closeFilters: () => setShowFilters(false),
      additionalFilterCleanFunction: () => {
        setFilterPanelFormElements(initialFormElementsState);
      },
    }),
    [showFilters, filterPanelInputs, filterPanelFormElements]
  );

  const getBgColor = (row: BackInStockRow) => {
    if ((row?.totalStock ?? 0) > 0) {
      return "bg-green-100";
    }
    return "";
  };

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
      },
    ],
    [t, showFilters]
  );

  const selectionActions = useMemo(
    () => [
      {
        name: t("Notify Back In Stock"),
        isButton: true,
        buttonClassName:
          "px-2 ml-auto bg-purple-600 hover:text-purple-600 hover:border-purple-600 sm:px-3 py-1 h-fit w-fit text-white hover:bg-white transition-transform border rounded-md cursor-pointer",
        onClick: () => {
          const menuItemIds = selectedRows
            .map((row: BackInStockRow) => row.menuItemId as number)
            .filter(Boolean);
          if (menuItemIds.length > 0) {
            notifyBackInStockSubscribersBulk(menuItemIds);
            setSelectedRows([]);
            setIsSelectionActive(false);
          }
        },
      },
    ],
    [
      t,
      selectedRows,
      notifyBackInStockSubscribersBulk,
      setSelectedRows,
      setIsSelectionActive,
    ]
  );

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        columns={columns as ColumnType[]}
        rows={rows}
        title={t("Back In Stock Subscriptions")}
        filterPanel={filterPanel}
        filters={filters}
        isActionsActive={true}
        rowClassNameFunction={getBgColor}
        actions={actions}
        selectionActions={selectionActions}
        isCollapsible={true}
      />
    </div>
  );
}
