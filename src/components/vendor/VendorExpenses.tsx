import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { AccountExpenseType, ExpenseTypes } from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import { useGetAccountExpense } from "../../utils/api/account/invoice";
import { useGetAccountPaymentMethods } from "../../utils/api/account/paymentMethod";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { outsideSort } from "../../utils/outsideSort";
import {
  BrandInput,
  ProductInput,
  StockLocationInput,
} from "../../utils/panelInputs";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { P1 } from "../panelComponents/Typography";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";
type FormElementsState = {
  [key: string]: any;
};
const VendorExpenses = () => {
  const { t } = useTranslation();
  const { vendorId } = useParams();
  const vendors = useGetAccountVendors();
  if (!vendorId) return <></>;

  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      product: "",
      service: "",
      type: ExpenseTypes.STOCKABLE,
      vendor: vendorId,
      brand: "",
      expenseType: "",
      location: "",
      date: "",
      before: "",
      after: "",
      sort: "",
      asc: 1,
    });
  const invoicesPayload = useGetAccountExpense(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );
  const invoices = invoicesPayload?.data;
  const brands = useGetAccountBrands();
  const products = useGetAccountProducts();
  const expenseTypes = useGetAccountExpenseTypes();
  const paymentMethods = useGetAccountPaymentMethods();
  const locations = useGetAccountStockLocations();
  const [tableKey, setTableKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [temporarySearch, setTemporarySearch] = useState("");
  const allRows = invoices?.map((invoice) => {
    return {
      ...invoice,
      product: getItem(invoice?.product, products)?.name,
      expenseType: getItem(invoice?.expenseType, expenseTypes)?.name,
      brand: getItem(invoice?.brand, brands)?.name,
      vendor: getItem(invoice?.vendor, vendors)?.name,
      lctn: getItem(invoice?.location, locations)?.name,
      formattedDate: formatAsLocalDate(invoice?.date),
      unitPrice: parseFloat(
        (invoice?.totalExpense / invoice?.quantity).toFixed(4)
      ),
      expType: getItem(invoice?.expenseType, expenseTypes),
      brnd: getItem(invoice?.brand, brands),
      vndr: getItem(invoice?.vendor, vendors),
      prdct: getItem(invoice?.product, products),
      paymentMethodName: t(
        getItem(invoice?.paymentMethod, paymentMethods)?.name ?? ""
      ),
    };
  });
  const [rows, setRows] = useState(allRows);

  const filterPanelInputs = [
    ProductInput({
      products: products.filter((i) => i.vendor?.includes(vendorId)),
      required: true,
    }),
    BrandInput({ brands: brands, required: true }),
    StockLocationInput({ locations: locations }),
    {
      type: InputTypes.DATE,
      formKey: "after",
      label: t("Start Date"),
      placeholder: t("Start Date"),
      required: true,
      isDatePicker: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "before",
      label: t("End Date"),
      placeholder: t("End Date"),
      required: true,
      isDatePicker: true,
    },
  ];
  const columns = [
    {
      key: "ID",
      isSortable: false,
      outsideSort: outsideSort(
        "_id",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
    },
    {
      key: t("Date"),
      isSortable: false,
      outsideSort: outsideSort(
        "date",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
      className: "min-w-32 pr-2",
    },
    {
      key: t("Note"),
      isSortable: false,
      outsideSort: outsideSort(
        "note",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
    },
    {
      key: t("Brand"),
      className: "min-w-32 pr-2",
      isSortable: false,
      outsideSort: outsideSort(
        "brand",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
    },
    {
      key: t("Vendor"),
      className: "min-w-32 pr-2",
      isSortable: false,
      outsideSort: outsideSort(
        "vendor",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
    },
    {
      key: t("Location"),
      isSortable: false,
      outsideSort: outsideSort(
        "location",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
    },
    {
      key: t("Expense Type"),
      className: "min-w-32 ",
      isSortable: false,
      outsideSort: outsideSort(
        "expenseType",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
    },
    {
      key: t("Product"),
      className: "min-w-32 pr-2",
      isSortable: false,
      outsideSort: outsideSort(
        "product",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
    },
    {
      key: t("Payment Method"),
      isSortable: false,
      outsideSort: outsideSort(
        "paymentMethod",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
    },
    {
      key: t("Quantity"),
      isSortable: false,
      outsideSort: outsideSort(
        "quantity",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
    },
    {
      key: t("Unit Price"),
      isSortable: false,
    },
    {
      key: t("Total Expense"),
      isSortable: false,
      outsideSort: outsideSort(
        "totalExpense",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
    },
  ];
  const rowKeys = [
    { key: "_id", className: "min-w-32 pr-2" },
    {
      key: "formattedDate",
      className: "min-w-32 pr-2",
    },
    { key: "note", className: "min-w-40 pr-2" },
    {
      key: "brand",
      className: "min-w-32 pr-2",
    },
    {
      key: "vendor",
      className: "min-w-32 pr-2",
    },
    {
      key: "lctn",
      className: "min-w-32 pr-4",
    },
    {
      key: "expenseType",
      node: (row: any) => {
        return (
          <div className=" min-w-32">
            <p
              className="w-fit rounded-md text-white text-sm ml-2 px-2 py-1 font-semibold "
              style={{
                backgroundColor: row?.expType?.backgroundColor,
              }}
            >
              {(row?.expType as AccountExpenseType)?.name}
            </p>
          </div>
        );
      },
    },
    {
      key: "product",
      className: "min-w-32 pr-2",
    },
    { key: "paymentMethodName", className: "min-w-32" },
    { key: "quantity", className: "min-w-32" },
    {
      key: "unitPrice",
      node: (row: any) => {
        return (
          <div className="min-w-32">
            <P1>{row.unitPrice} ₺</P1>
          </div>
        );
      },
    },
    {
      key: "totalExpense",
      node: (row: any) => {
        return (
          <div className="min-w-32">
            <P1>
              {parseFloat(row.totalExpense)
                .toFixed(4)
                .replace(/\.?0*$/, "")}{" "}
              ₺
            </P1>
          </div>
        );
      },
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
    isApplyButtonActive: true,
  };
  const pagination = invoicesPayload
    ? {
        totalPages: invoicesPayload.totalPages,
        totalRows: invoicesPayload.totalNumber,
      }
    : null;
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements]);
  useEffect(() => {
    setTableKey((prev) => prev + 1);
    setRows(allRows);
  }, [
    invoicesPayload,
    products,
    expenseTypes,
    brands,
    vendors,
    locations,
    paymentMethods,
  ]);
  return (
    <div className="w-[95%] mx-auto ">
      <GenericTable
        key={vendorId + tableKey}
        rowKeys={rowKeys}
        columns={columns}
        filters={filters}
        filterPanel={filterPanel}
        rows={rows ?? []}
        title={t("Vendor Expenses")}
        isSearch={false}
        {...(pagination && { pagination })}
        isActionsActive={false}
      />
    </div>
  );
};
export default VendorExpenses;
