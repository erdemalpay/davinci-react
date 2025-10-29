import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import {
  AccountExpenseType,
  ExpenseTypes,
  commonDateOptions,
} from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountExpenses } from "../../utils/api/account/expense";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import { useGetAccountPaymentMethods } from "../../utils/api/account/paymentMethod";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetStockLocations } from "../../utils/api/location";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import {
  BrandInput,
  StockLocationInput,
  VendorInput,
} from "../../utils/panelInputs";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { P1 } from "../panelComponents/Typography";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};
const ProductExpenses = () => {
  const { t } = useTranslation();
  const brands = useGetAccountBrands();
  const vendors = useGetAccountVendors();
  const { productId } = useParams();
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      product: productId,
      service: [],
      type: ExpenseTypes.STOCKABLE,
      vendor: "",
      brand: "",
      expenseType: "",
      paymentMethod: "",
      location: "",
      date: "",
      before: "",
      after: "",
      sort: "",
      asc: 1,
      search: "",
    });
  const invoicesPayload = useGetAccountExpenses(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );
  const invoices = invoicesPayload?.data;
  const products = useGetAccountProducts();
  const expenseTypes = useGetAccountExpenseTypes();
  const selectedProduct = products?.find(
    (product) => product._id === productId
  );
  if (!selectedProduct) return <></>;
  const locations = useGetStockLocations();
  const [tableKey, setTableKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const paymentMethods = useGetAccountPaymentMethods();
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
    VendorInput({ vendors: vendors, required: true }),
    BrandInput({ brands: brands, required: true }),
    StockLocationInput({ locations: locations }),
    {
      type: InputTypes.SELECT,
      formKey: "date",
      label: t("Date"),
      options: commonDateOptions.map((option) => {
        return {
          value: option.value,
          label: t(option.label),
        };
      }),
      placeholder: t("Date"),
      required: true,
    },
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
      correspondingKey: "_id",
    },
    {
      key: t("Date"),
      isSortable: false,
      correspondingKey: "date",
      className: "min-w-32 pr-2",
    },
    {
      key: t("Note"),
      isSortable: false,
      correspondingKey: "note",
    },
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
    {
      key: t("Location"),
      isSortable: false,
      correspondingKey: "location",
    },
    {
      key: t("Expense Type"),
      className: "min-w-32 ",
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
    {
      key: t("Quantity"),
      isSortable: false,
      correspondingKey: "quantity",
    },
    {
      key: t("Unit Price"),
      isSortable: false,
    },
    {
      key: t("Total Expense"),
      isSortable: false,
      correspondingKey: "totalExpense",
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
    filterPanelFormElements: filterPanelFormElements,
    setFilterPanelFormElements: setFilterPanelFormElements,
  };
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
        key={selectedProduct?._id + tableKey}
        rowKeys={rowKeys}
        columns={columns}
        filters={filters}
        outsideSortProps={outsideSort}
        outsideSearchProps={outsideSearchProps}
        filterPanel={filterPanel}
        rows={rows ?? []}
        title={t("Product Expenses")}
        isSearch={false}
        isActionsActive={false}
        {...(pagination && { pagination })}
      />
    </div>
  );
};

export default ProductExpenses;
