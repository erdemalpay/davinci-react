import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActionType } from "../components/panelComponents/shared/types";
import { AccountProduct, AccountStock, Location, MenuItem } from "../types";
import { getItem } from "../utils/getItem";

const EMPTY_ACTIONS: never[] = [];

type StockTableColumn = {
  key: string;
  isSortable: boolean;
  correspondingKey?: string;
};

type UseStockTableModeProps = {
  filteredStocks: AccountStock[] | undefined;
  products: AccountProduct[];
  items: MenuItem[];
  locations: Location[];
  locationFilter: AccountStock["location"] | "";
  isEnableEdit: boolean;
  columns: StockTableColumn[];
  sortByTotalQuantity?: boolean;
  requireLocationName?: boolean;
};

export const useStockTableMode = ({
  filteredStocks,
  products,
  items,
  locations,
  locationFilter,
  isEnableEdit,
  columns,
  sortByTotalQuantity = false,
  requireLocationName = false,
}: UseStockTableModeProps) => {
  const { t } = useTranslation();
  const isLocationFilterActive = !!locationFilter;

  const rows = useMemo(() => {
    const deriveStockFields = (stock: AccountStock) => {
      const rowProduct = getItem(stock?.product, products);
      const rowItem = getItem(rowProduct?.matchedMenuItem, items);
      const unitPrice = rowProduct?.unitPrice ?? 0;
      const quantity = stock?.quantity;
      return {
        rowItem,
        productName: rowProduct?.name,
        unitPrice,
        quantity,
        totalPrice: parseFloat((unitPrice * quantity)?.toFixed(1)),
      };
    };

    if (isLocationFilterActive) {
      return (
        filteredStocks
          ?.map((stock) => {
            const { rowItem, productName, unitPrice, quantity, totalPrice } =
              deriveStockFields(stock);
            if (!productName) return null;
            return {
              ...stock,
              prdct: productName,
              sku: rowItem?.sku ?? "",
              barcode: rowItem?.barcode ?? "",
              totalQuantity: quantity,
              unitPrice,
              menuPrice: rowItem?.price ?? "",
              onlineMenuPrice: rowItem?.onlinePrice ?? "",
              totalGroupPrice: totalPrice,
              stockId: stock?._id,
              stockProduct: stock?.product,
              stockLocation: stock?.location,
              stockQuantity: quantity,
            };
          })
          .filter(Boolean) ?? []
      );
    }

    const processedRows = filteredStocks?.reduce((acc: any, stock) => {
      const { rowItem, productName, unitPrice, quantity, totalPrice } =
        deriveStockFields(stock);
      const locationName = getItem(stock?.location, locations)?.name;
      if (!productName || (requireLocationName && !locationName)) {
        return acc;
      }
      if (!acc[productName]) {
        acc[productName] = {
          ...stock,
          prdct: productName,
          sku: rowItem?.sku ?? "",
          barcode: rowItem?.barcode ?? "",
          unitPrice,
          menuPrice: rowItem?.price ?? "",
          onlineMenuPrice: rowItem?.onlinePrice ?? "",
          totalGroupPrice: 0,
          totalQuantity: 0,
          collapsible: {
            collapsibleColumns: [
              { key: t("Location"), isSortable: true },
              { key: t("Quantity"), isSortable: true },
              isEnableEdit
                ? { key: t("Actions"), isSortable: false }
                : undefined,
            ].filter(Boolean),
            collapsibleRowKeys: [{ key: "location" }, { key: "quantity" }],
            collapsibleRows: [],
          },
        };
      }
      acc[productName].totalGroupPrice += totalPrice;
      acc[productName].totalQuantity += quantity;
      acc[productName].collapsible.collapsibleRows.push({
        stockId: stock?._id,
        stockProduct: stock?.product,
        stockLocation: stock?.location,
        stockQuantity: stock?.quantity,
        stockUnitPrice: unitPrice,
        location: locationName,
        quantity: quantity,
        totalPrice: totalPrice,
      });

      return acc;
    }, {});

    const groupedRows = Object.values(processedRows || {});
    if (sortByTotalQuantity) {
      return groupedRows.sort(
        (a, b) =>
          (b as { totalQuantity: number }).totalQuantity -
          (a as { totalQuantity: number }).totalQuantity
      );
    }
    return groupedRows;
  }, [
    filteredStocks,
    products,
    items,
    locations,
    t,
    isEnableEdit,
    isLocationFilterActive,
    sortByTotalQuantity,
    requireLocationName,
  ]);

  const columnsWithActions = useMemo(() => {
    if (!isLocationFilterActive) return columns;
    return [...columns, { key: t("Actions"), isSortable: false }];
  }, [columns, isLocationFilterActive, t]);

  const generalTotalExpense = useMemo(() => {
    return (rows?.reduce((acc: number, stock: any) => {
      const expense = parseFloat(stock?.totalGroupPrice?.toFixed(1) || "0");
      return acc + expense;
    }, 0) || 0) as number;
  }, [rows]);

  const getTableModeProps = useCallback(
    <T,>(actions: ActionType<T>[]) => ({
      actions: isLocationFilterActive ? actions : undefined,
      collapsibleActions:
        !isLocationFilterActive && isEnableEdit ? actions : EMPTY_ACTIONS,
      isActionsActive: isLocationFilterActive || isEnableEdit,
      isCollapsible: !isLocationFilterActive,
    }),
    [isLocationFilterActive, isEnableEdit]
  );

  return {
    rows,
    columns: columnsWithActions,
    isLocationFilterActive,
    generalTotalExpense,
    getTableModeProps,
  };
};
