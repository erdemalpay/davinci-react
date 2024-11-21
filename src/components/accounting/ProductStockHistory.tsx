import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { FormElementsState, stockHistoryStatuses } from "../../types";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  StockHistoryPayload,
  useGetAccountProductStockHistorys,
} from "../../utils/api/account/productStockHistory";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { useGetUsers } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { ProductInput, StockLocationInput } from "../../utils/panelInputs";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { H5 } from "../panelComponents/Typography";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";
const ProductStockHistory = () => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const { rowsPerPage } = useGeneralContext();
  const [usedRowsPerPage, setUsedRowsPerPage] = useState(rowsPerPage);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      product: [],
      expenseType: "",
      location: "",
      status: "",
      before: "",
      after: "",
      sort: "",
      asc: 1,
    });
  const stockHistoriesPayload = useGetAccountProductStockHistorys(
    currentPage,
    usedRowsPerPage,
    filterPanelFormElements
  );
  stockHistoriesPayload as StockHistoryPayload;
  const [tableKey, setTableKey] = useState(0);
  const products = useGetAccountProducts();
  const users = useGetUsers();
  const expenseTypes = useGetAccountExpenseTypes();
  const locations = useGetAccountStockLocations();
  const [showFilters, setShowFilters] = useState(false);
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
  function handleSort(value: string) {
    if (filterPanelFormElements.sort === value) {
      setFilterPanelFormElements({
        ...filterPanelFormElements,
        asc: filterPanelFormElements.asc === 1 ? -1 : 1,
      });
    } else {
      setFilterPanelFormElements({
        ...filterPanelFormElements,
        asc: value === "createdAt" ? 1 : -1,
        sort: value,
      });
    }
  }
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
  const createColumn = (key: string, title: string) => ({
    key: t(title),
    isSortable: true,
    node: () => (
      <th
        key={key}
        className="font-bold text-left cursor-pointer"
        onClick={() => handleSort(key)}
      >
        <div className="flex gap-x-2 pl-3 items-center py-3 min-w-8">
          <H5>{t(title)}</H5>
          {filterPanelFormElements.sort === key &&
            (filterPanelFormElements.asc === 1 ? (
              <ArrowUpIcon className="h-4 w-4 my-auto" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 my-auto" />
            ))}
        </div>
      </th>
    ),
  });
  const columns = [
    createColumn("createdAt", "Date"),
    { key: t("Hour"), isSortable: false },
    createColumn("user", "User"),
    createColumn("product", "Product"),
    createColumn("location", "Location"),
    { key: t("Old Quantity"), isSortable: false },
    { key: t("Changed"), isSortable: false },
    { key: t("New Quantity"), isSortable: false },
    createColumn("status", "Status"),
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
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  const pagination = stockHistoriesPayload
    ? {
        currentPage: stockHistoriesPayload.page,
        totalPages: stockHistoriesPayload.totalPages,
        setCurrentPage: setCurrentPage,
        rowsPerPage: usedRowsPerPage,
        setRowsPerPage: setUsedRowsPerPage,
        totalRows: stockHistoriesPayload.totalNumber,
      }
    : null;
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
    isApplyButtonActive: true,
  };
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements]);

  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [stockHistoriesPayload, users, products, locations, expenseTypes]);

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
          title={t("Product Stock History")}
          isActionsActive={false}
          {...(pagination && { pagination })}
        />
      </div>
    </>
  );
};

export default ProductStockHistory;
