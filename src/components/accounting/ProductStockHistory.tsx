import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFilterContext } from "../../context/Filter.context";
import { useGeneralContext } from "../../context/General.context";
import { stockHistoryStatuses } from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  StockHistoryPayload,
  useGetAccountProductStockHistorys,
} from "../../utils/api/account/productStockHistory";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetStockLocations } from "../../utils/api/location";
import { useGetUsers } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import {
  BrandInput,
  ProductInput,
  StockLocationInput,
  VendorInput,
} from "../../utils/panelInputs";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

const ProductStockHistory = () => {
  const { t } = useTranslation();
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const {
    filterProductStockHistoryPanelFormElements,
    setFilterProductStockHistoryPanelFormElements,
    showProductStockHistoryFilters,
    setShowProductStockHistoryFilters,
  } = useFilterContext();
  const stockHistoriesPayload = useGetAccountProductStockHistorys(
    currentPage,
    rowsPerPage,
    filterProductStockHistoryPanelFormElements
  );
  const vendors = useGetAccountVendors();
  const brands = useGetAccountBrands();
  stockHistoriesPayload as StockHistoryPayload;
  const [tableKey, setTableKey] = useState(0);
  const products = useGetAccountProducts();
  const users = useGetUsers();
  const expenseTypes = useGetAccountExpenseTypes();
  const locations = useGetStockLocations();
  const pad = (num: number) => (num < 10 ? `0${num}` : num);
  const allRows = stockHistoriesPayload?.data
    ?.map((stockHistory) => {
      if (!stockHistory?.createdAt) {
        return null;
      }
      const date = new Date(stockHistory.createdAt);
      return {
        ...stockHistory,
        prdct: getItem(stockHistory.product, products)?.name,
        lctn: getItem(stockHistory?.location, locations)?.name,
        usr: getItem(stockHistory?.user, users)?.name,
        newQuantity:
          (stockHistory?.currentAmount ?? 0) + (stockHistory?.change ?? 0),
        date: format(stockHistory?.createdAt, "yyyy-MM-dd"),
        formattedDate: formatAsLocalDate(
          format(stockHistory?.createdAt, "yyyy-MM-dd")
        ),
        hour: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
      };
    })
    .filter((item) => item !== null);
  const [rows, setRows] = useState(allRows);

  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "expenseType",
      label: t("Expense Type"),
      options: expenseTypes?.map((expenseType) => {
        return {
          value: expenseType?._id,
          label: expenseType?.name,
        };
      }),
      placeholder: t("Expense Type"),
      required: true,
    },
    ProductInput({
      products: products,
      required: true,
      isMultiple: true,
    }),
    VendorInput({ vendors: vendors }),
    BrandInput({ brands: brands }),
    StockLocationInput({ locations: locations }),
    {
      type: InputTypes.SELECT,
      formKey: "status",
      label: t("Status"),
      options: stockHistoryStatuses?.map((item) => {
        return {
          value: item.value,
          label: t(item.label),
        };
      }),
      placeholder: t("Status"),
      isMultiple: true,
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
      key: t("Date"),
      isSortable: false,
      correspondingKey: "createdAt",
    },
    { key: t("Hour"), isSortable: false },
    {
      key: t("User"),
      isSortable: false,
      correspondingKey: "user",
    },
    {
      key: t("Product"),
      isSortable: false,
      correspondingKey: "product",
    },
    {
      key: t("Location"),
      isSortable: false,
      correspondingKey: "location",
    },
    { key: t("Old Quantity"), isSortable: false },
    { key: t("Changed"), isSortable: false },
    { key: t("New Quantity"), isSortable: false },
    {
      key: t("Status"),
      isSortable: false,
      correspondingKey: "status",
    },
  ];
  const rowKeys = [
    {
      key: "date",
      className: "min-w-32 pr-1",
      node: (row: any) => {
        return <p>{row.formattedDate}</p>;
      },
    },
    {
      key: "hour",
      className: "min-w-32 pr-1",
    },
    {
      key: "usr",
      className: "min-w-32 pr-1",
    },
    {
      key: "prdct",
      className: "min-w-32 pr-1",
    },
    {
      key: "lctn",
      className: "min-w-32 pr-1",
    },
    {
      key: "currentAmount",
      className: "min-w-32 pr-1",
    },
    {
      key: "change",
      className: "min-w-32 pr-1",
    },
    {
      key: "newQuantity",
      className: "min-w-32 pr-1",
    },
    {
      key: "status",
      className: "min-w-32 pr-1",
      node: (row: any) => {
        const status = stockHistoryStatuses.find(
          (item) => item.value === row.status
        );
        if (!status) return null;
        return (
          <div
            className={`w-fit rounded-md text-sm  px-2 py-1 font-semibold  ${status?.backgroundColor} text-white`}
          >
            {t(status?.label)}
          </div>
        );
      },
    },
  ];
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showProductStockHistoryFilters}
          onChange={() => {
            setShowProductStockHistoryFilters(!showProductStockHistoryFilters);
          }}
        />
      ),
    },
  ];
  const pagination = stockHistoriesPayload
    ? {
        totalPages: stockHistoriesPayload.totalPages,
        totalRows: stockHistoriesPayload.totalNumber,
      }
    : null;
  const filterPanel = {
    isFilterPanelActive: showProductStockHistoryFilters,
    inputs: filterPanelInputs,
    formElements: filterProductStockHistoryPanelFormElements,
    setFormElements: setFilterProductStockHistoryPanelFormElements,
    closeFilters: () => setShowProductStockHistoryFilters(false),
  };
  const outsideSort = {
    filterPanelFormElements: filterProductStockHistoryPanelFormElements,
    setFilterPanelFormElements: setFilterProductStockHistoryPanelFormElements,
  };
  useEffect(() => {
    setCurrentPage(1);
  }, [filterProductStockHistoryPanelFormElements]);

  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [
    stockHistoriesPayload,
    users,
    products,
    locations,
    expenseTypes,
    vendors,
    brands,
  ]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows ?? []}
          filterPanel={filterPanel}
          filters={filters}
          isSearch={false}
          title={t("Product Stock History")}
          isActionsActive={false}
          outsideSortProps={outsideSort}
          {...(pagination && { pagination })}
        />
      </div>
    </>
  );
};

export default ProductStockHistory;
