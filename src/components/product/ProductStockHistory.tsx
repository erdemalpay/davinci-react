import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { stockHistoryStatuses } from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetAccountProductStockHistorys } from "../../utils/api/account/productStockHistory";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetStockLocations } from "../../utils/api/location";
import { useGetUsers } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import {
  BrandInput,
  StockLocationInput,
  VendorInput,
} from "../../utils/panelInputs";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};
const ProductStockHistory = () => {
  const { t } = useTranslation();
  const { productId } = useParams();
  const products = useGetAccountProducts();
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const selectedProduct = products?.find(
    (product) => product._id === productId
  );
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      product: selectedProduct?._id,
      expenseType: "",
      location: "",
      status: [],
      before: "",
      after: "",
      sort: "",
      asc: 1,
      vendor: "",
      brand: "",
    });
  const users = useGetUsers();
  const vendors = useGetAccountVendors();
  const brands = useGetAccountBrands();
  if (!selectedProduct) return <></>;
  const stockHistoriesPayload = useGetAccountProductStockHistorys(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );
  const [tableKey, setTableKey] = useState(0);
  const locations = useGetStockLocations();
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
  const filterPanelInputs = [
    StockLocationInput({ locations: locations }),
    VendorInput({ vendors: vendors }),
    BrandInput({ brands: brands }),
    {
      type: InputTypes.SELECT,
      formKey: "status",
      label: t("Status"),
      options: stockHistoryStatuses.map((item) => {
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
            className={`w-fit rounded-md text-sm px-2 py-1 font-semibold  ${status?.backgroundColor} text-white`}
          >
            {t(status?.label)}
          </div>
        );
      },
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
  };
  const pagination = stockHistoriesPayload
    ? {
        totalPages: stockHistoriesPayload.totalPages,
        totalRows: stockHistoriesPayload.totalNumber,
      }
    : null;
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  const outsideSort = {
    filterPanelFormElements: filterPanelFormElements,
    setFilterPanelFormElements: setFilterPanelFormElements,
  };
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements]);
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [stockHistoriesPayload, users, products, locations, brands, vendors]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows ?? []}
          outsideSortProps={outsideSort}
          filterPanel={filterPanel}
          isSearch={false}
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
