// src/components/expenses/GenericExpenses.tsx
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { AccountExpenseType, FormElementsState } from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountExpenses } from "../../utils/api/account/expense";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import { useGetAccountPaymentMethods } from "../../utils/api/account/paymentMethod";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetStockLocations } from "../../utils/api/location";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { P1 } from "../panelComponents/Typography";
import SwitchButton from "../panelComponents/common/SwitchButton";

type GenericExpensesProps = {
  filterPanelFormElements: FormElementsState;
  setFilterPanelFormElements: (
    updater:
      | FormElementsState
      | ((prev: FormElementsState) => FormElementsState)
  ) => void;
  filterPanelInputs: any[];
  title?: string;
};

const GenericExpenses = ({
  filterPanelFormElements,
  setFilterPanelFormElements,
  filterPanelInputs,
  title,
}: GenericExpensesProps) => {
  const { t } = useTranslation();
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const brands = useGetAccountBrands();
  const products = useGetAccountProducts();
  const expenseTypes = useGetAccountExpenseTypes();
  const paymentMethods = useGetAccountPaymentMethods();
  const vendors = useGetAccountVendors();
  const locations = useGetStockLocations();
  const invoicesPayload = useGetAccountExpenses(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );
  const invoices = invoicesPayload?.data;
  const allRows = useMemo(
    () =>
      invoices?.map((invoice) => {
        const product = getItem(invoice?.product, products);
        const expenseType = getItem(invoice?.expenseType, expenseTypes);
        const brand = getItem(invoice?.brand, brands);
        const vendor = getItem(invoice?.vendor, vendors);
        const location = getItem(invoice?.location, locations);
        const paymentMethod = getItem(invoice?.paymentMethod, paymentMethods);
        const unitPrice = parseFloat(
          (invoice?.totalExpense / invoice?.quantity).toFixed(4)
        );

        return {
          ...invoice,
          product: product?.name,
          expenseType: expenseType?.name,
          brand: brand?.name,
          vendor: vendor?.name,
          lctn: location?.name,
          formattedDate: formatAsLocalDate(invoice?.date),
          unitPrice,
          expType: expenseType,
          brnd: brand,
          vndr: vendor,
          prdct: product,
          paymentMethodName: t(paymentMethod?.name ?? ""),
        };
      }) ?? [],
    [
      invoices,
      products,
      expenseTypes,
      brands,
      vendors,
      locations,
      paymentMethods,
      t,
    ]
  );
  const [rows, setRows] = useState(allRows);
  const [tableKey, setTableKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements, setCurrentPage]);
  useEffect(() => {
    setTableKey((prev) => prev + 1);
    setRows(allRows);
  }, [allRows]);
  const columns = [
    { key: "ID", isSortable: false, correspondingKey: "_id" },
    {
      key: t("Date"),
      isSortable: false,
      correspondingKey: "date",
      className: "min-w-32 pr-2",
    },
    { key: t("Note"), isSortable: false, correspondingKey: "note" },
    {
      key: t("Brand"),
      className: "min-w-32 pr-2",
      isSortable: false,
      correspondingKey: "brand",
    },
    {
      key: t("Vendor"),
      className: "min-w-32 pr-2",
      isSortable: false,
      correspondingKey: "vendor",
    },
    { key: t("Location"), isSortable: false, correspondingKey: "location" },
    {
      key: t("Expense Type"),
      className: "min-w-32",
      isSortable: false,
      correspondingKey: "expenseType",
    },
    {
      key: t("Product"),
      className: "min-w-32 pr-2",
      isSortable: false,
      correspondingKey: "product",
    },
    {
      key: t("Payment Method"),
      isSortable: false,
      correspondingKey: "paymentMethod",
    },
    { key: t("Quantity"), isSortable: false, correspondingKey: "quantity" },
    { key: t("Unit Price"), isSortable: false },
    {
      key: t("Total Expense"),
      isSortable: false,
      correspondingKey: "totalExpense",
    },
  ];

  const rowKeys = [
    { key: "_id", className: "min-w-32 pr-2" },
    { key: "formattedDate", className: "min-w-32 pr-2" },
    { key: "note", className: "min-w-40 pr-2" },
    { key: "brand", className: "min-w-32 pr-2" },
    { key: "vendor", className: "min-w-32 pr-2" },
    { key: "lctn", className: "min-w-32 pr-4" },
    {
      key: "expenseType",
      node: (row: any) => (
        <div className="min-w-32">
          <p
            className="w-fit rounded-md text-white text-sm ml-2 px-2 py-1 font-semibold"
            style={{ backgroundColor: row?.expType?.backgroundColor }}
          >
            {(row?.expType as AccountExpenseType)?.name}
          </p>
        </div>
      ),
    },
    { key: "product", className: "min-w-32 pr-2" },
    { key: "paymentMethodName", className: "min-w-32" },
    { key: "quantity", className: "min-w-32" },
    {
      key: "unitPrice",
      node: (row: any) => (
        <div className="min-w-32">
          <P1>{row.unitPrice} ₺</P1>
        </div>
      ),
    },
    {
      key: "totalExpense",
      node: (row: any) => (
        <div className="min-w-32">
          <P1>
            {parseFloat(row.totalExpense)
              .toFixed(4)
              .replace(/\.?0*$/, "")}{" "}
            ₺
          </P1>
        </div>
      ),
    },
  ];

  const filters = [
    {
      label: t("Total") + " :",
      isUpperSide: false,
      node: (
        <div className="flex flex-row gap-2">
          <p>
            {new Intl.NumberFormat("en-US", {
              style: "decimal",
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            }).format(invoicesPayload?.generalTotalExpense ?? 0)}{" "}
            ₺
          </p>
        </div>
      ),
    },
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];

  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
  };

  const pagination = invoicesPayload
    ? {
        totalPages: invoicesPayload.totalPages,
        totalRows: invoicesPayload.totalNumber,
      }
    : null;

  const outsideSearchProps = useMemo(() => {
    return {
      t,
      filterPanelFormElements,
      setFilterPanelFormElements,
    };
  }, [t, filterPanelFormElements, setFilterPanelFormElements]);

  const outsideSort = {
    filterPanelFormElements,
    setFilterPanelFormElements,
  };

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        key={(title ?? "expenses") + tableKey}
        rowKeys={rowKeys}
        columns={columns}
        filters={filters}
        outsideSortProps={outsideSort}
        outsideSearchProps={outsideSearchProps}
        filterPanel={filterPanel}
        rows={rows}
        title={title ?? t("Expenses")}
        isSearch={false}
        {...(pagination && { pagination })}
        isActionsActive={false}
        isAllRowPerPageOption={false}
      />
    </div>
  );
};

export default GenericExpenses;
