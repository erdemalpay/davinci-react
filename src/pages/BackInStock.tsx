import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useGeneralContext } from "../context/General.context";
import {
  BackInStockSubscription,
  SubscriptionStatus,
  useGetBackInStockSubscriptions,
} from "../utils/api/backInStock";
import { useGetMenuItems } from "../utils/api/menu/menu-item";
import { formatAsLocalDate } from "../utils/format";
import { getItem } from "../utils/getItem";

type FormElementsState = {
  [key: string]: any;
};

export default function BackInStock() {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [isGameGrouped, setIsGameGrouped] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      email: "",
      shop: "",
      productId: "",
      variantId: "",
      status: "",
      after: "",
      before: "",
      sort: "createdAt",
      asc: -1,
    });
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const menuItems = useGetMenuItems();

  const subscriptionsPayload = useGetBackInStockSubscriptions(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );

  // Group subscriptions by productTitle (when toggle is off) or menuItemId (when toggle is on)
  const groupedByProduct = useMemo(() => {
    if (!subscriptionsPayload?.subscriptions) return new Map<string, BackInStockSubscription[]>();
    const grouped = new Map<string, BackInStockSubscription[]>();
    
    subscriptionsPayload.subscriptions.forEach((subscription) => {
      const groupKey = subscription.productTitle || subscription.productId;
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      grouped.get(groupKey)?.push(subscription);
    });
    
    return grouped;
  }, [subscriptionsPayload?.subscriptions]);

  const groupedByGame = useMemo(() => {
    if (!subscriptionsPayload?.subscriptions) return new Map<number, BackInStockSubscription[]>();
    const grouped = new Map<number, BackInStockSubscription[]>();
    
    subscriptionsPayload.subscriptions.forEach((subscription) => {
      if (subscription.menuItemId) {
        if (!grouped.has(subscription.menuItemId)) {
          grouped.set(subscription.menuItemId, []);
        }
        grouped.get(subscription.menuItemId)?.push(subscription);
      }
    });
    
    return grouped;
  }, [subscriptionsPayload?.subscriptions]);

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

    // Count only ACTIVE subscriptions
    const activeCount = sortedSubscriptions.filter(
      (s) => s.status === SubscriptionStatus.ACTIVE
    ).length;

    return {
      ...sortedSubscriptions[0],
      [mainKey]: mainValue,
      requestCount: activeCount,
      collapsible: {
        collapsibleHeader: t("Subscriptions for {{name}}", { name: mainValue }),
        collapsibleColumns: [
          { key: t("Email"), isSortable: true },
          { key: t("Product"), isSortable: true },
          { key: t("Status"), isSortable: true },
          { key: t("Subscribed At"), isSortable: true },
        ],
        collapsibleRows: sortedSubscriptions,
        collapsibleRowKeys: [
          { key: "email" },
          { key: "productTitle" },
          {
            key: "status",
            node: (row: any) => {
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
            node: (row: any) => formatAsLocalDate(row.subscribedAt),
          },
        ],
      },
    };
  };

  // Process rows based on toggle state
  const rows = useMemo(() => {
    if (!subscriptionsPayload?.subscriptions) return [];

    if (isGameGrouped) {
      // Group by menuItemId (game)
      const result: any[] = [];
      
      groupedByGame.forEach((subscriptions, menuItemId) => {
        if (subscriptions.length === 0) return;
        
        const menuItem = getItem(menuItemId, menuItems || []);
        const gameName = menuItem?.name || `Game ID: ${menuItemId}`;
        
        const mainRow = createCollapsibleRow(subscriptions, "gameName", gameName);
        mainRow.menuItemId = menuItemId;
        result.push(mainRow);
      });
      
      // Add subscriptions without menuItemId grouped by productTitle
      const subscriptionsWithoutGame = subscriptionsPayload.subscriptions.filter(
        (s) => !s.menuItemId
      );
      
      if (subscriptionsWithoutGame.length > 0) {
        const groupedWithoutGame = new Map<string, BackInStockSubscription[]>();
        subscriptionsWithoutGame.forEach((subscription) => {
          const groupKey = subscription.productTitle || subscription.productId;
          if (!groupedWithoutGame.has(groupKey)) {
            groupedWithoutGame.set(groupKey, []);
          }
          groupedWithoutGame.get(groupKey)?.push(subscription);
        });
        
        groupedWithoutGame.forEach((subscriptions, productTitle) => {
          const mainRow = createCollapsibleRow(subscriptions, "productTitle", productTitle);
          result.push(mainRow);
        });
      }
      
      return result;
    } else {
      // Group by productTitle
      const result: any[] = [];
      
      groupedByProduct.forEach((subscriptions, productTitle) => {
        if (subscriptions.length === 0) return;
        
        const mainRow = createCollapsibleRow(subscriptions, "productTitle", productTitle);
        result.push(mainRow);
      });
      
      return result;
    }
  }, [subscriptionsPayload?.subscriptions, isGameGrouped, groupedByGame, groupedByProduct, menuItems, t]);

  const columns = useMemo(
    () => [
      { 
        key: isGameGrouped ? t("Game") : t("Product"), 
        isSortable: true, 
        correspondingKey: isGameGrouped ? "gameName" : "productTitle" 
      },
      { key: t("Request Count"), isSortable: false },
    ],
    [t, isGameGrouped]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: isGameGrouped ? "gameName" : "productTitle",
        className: "min-w-48",
      },
      {
        key: "requestCount",
        className: "min-w-24",
        node: (row: any) => {
          return (
            <span className="font-medium text-gray-700">
              {row.requestCount || 0}
            </span>
          );
        },
      },
    ],
    [isGameGrouped]
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
        type: InputTypes.TEXT,
        formKey: "shop",
        label: t("Shop"),
        placeholder: t("Shop"),
        required: false,
      },
      {
        type: InputTypes.TEXT,
        formKey: "productId",
        label: t("Product ID"),
        placeholder: t("Product ID"),
        required: false,
      },
      {
        type: InputTypes.TEXT,
        formKey: "variantId",
        label: t("Variant ID"),
        placeholder: t("Variant ID"),
        required: false,
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
    }),
    [showFilters, filterPanelInputs, filterPanelFormElements]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Game Based"),
        isUpperSide: true,
        node: <SwitchButton checked={isGameGrouped} onChange={setIsGameGrouped} />,
      },
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
      },
    ],
    [t, showFilters, isGameGrouped]
  );

  const outsideSort = useMemo(
    () => ({
      filterPanelFormElements: filterPanelFormElements,
      setFilterPanelFormElements: setFilterPanelFormElements,
    }),
    [filterPanelFormElements]
  );

  const pagination = useMemo(() => {
    return subscriptionsPayload
      ? {
          totalPages: subscriptionsPayload.totalPages,
          totalRows: subscriptionsPayload.total,
        }
      : null;
  }, [subscriptionsPayload]);

  const outsideSearchProps = useMemo(() => {
    return {
      t,
      filterPanelFormElements,
      setFilterPanelFormElements,
    };
  }, [t, filterPanelFormElements]);

  useMemo(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements, isGameGrouped, setCurrentPage]);

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        columns={columns}
        rows={rows}
        outsideSearchProps={outsideSearchProps}
        isSearch={false}
        title={t("Back In Stock Subscriptions")}
        filterPanel={filterPanel}
        filters={filters}
        isActionsActive={false}
        outsideSortProps={outsideSort}
        isCollapsible={true}
        {...(pagination && { pagination })}
        isAllRowPerPageOption={false}
      />
    </div>
  );
}
