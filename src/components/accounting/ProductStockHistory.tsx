import { format } from "date-fns";
import { useMemo } from "react";
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
import { useGetUsersMinimal } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
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
  const products = useGetAccountProducts();
  const users = useGetUsersMinimal();
  const expenseTypes = useGetAccountExpenseTypes();
  const locations = useGetStockLocations();

  const pad = useMemo(() => (num: number) => num < 10 ? `0${num}` : num, []);

  const rows = useMemo(() => {
    return stockHistoriesPayload?.data
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
  }, [stockHistoriesPayload, products, locations, users, pad]);

  const filterPanelInputs = useMemo(
    () => [
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
      {
        type: InputTypes.SELECT,
        formKey: "product",
        label: t("Product"),
        options: products.map((product) => {
          return {
            value: product._id,
            label: product.name,
          };
        }),
        placeholder: t("Product"),
        required: true,
        isMultiple: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "vendor",
        label: t("Vendor"),
        options: vendors.map((vendor) => {
          return {
            value: vendor._id,
            label: vendor.name,
          };
        }),
        placeholder: t("Vendor"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "brand",
        label: t("Brand"),
        options: brands.map((brand) => ({
          value: brand._id,
          label: brand.name,
        })),
        placeholder: t("Brand"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: locations.map((input) => {
          return {
            value: input._id,
            label: input.name,
          };
        }),
        placeholder: t("Location"),
        required: true,
      },
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
    ],
    [expenseTypes, products, vendors, brands, locations, t]
  );

  const columns = useMemo(
    () => [
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
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
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
    ],
    [t]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showProductStockHistoryFilters}
            onChange={() => {
              setShowProductStockHistoryFilters(
                !showProductStockHistoryFilters
              );
            }}
          />
        ),
      },
    ],
    [t, showProductStockHistoryFilters, setShowProductStockHistoryFilters]
  );

  const pagination = useMemo(() => {
    return stockHistoriesPayload
      ? {
          totalPages: stockHistoriesPayload.totalPages,
          totalRows: stockHistoriesPayload.totalNumber,
        }
      : null;
  }, [stockHistoriesPayload]);

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showProductStockHistoryFilters,
      inputs: filterPanelInputs,
      formElements: filterProductStockHistoryPanelFormElements,
      setFormElements: setFilterProductStockHistoryPanelFormElements,
      closeFilters: () => setShowProductStockHistoryFilters(false),
    }),
    [
      showProductStockHistoryFilters,
      filterPanelInputs,
      filterProductStockHistoryPanelFormElements,
      setFilterProductStockHistoryPanelFormElements,
      setShowProductStockHistoryFilters,
    ]
  );

  const outsideSort = useMemo(
    () => ({
      filterPanelFormElements: filterProductStockHistoryPanelFormElements,
      setFilterPanelFormElements: setFilterProductStockHistoryPanelFormElements,
    }),
    [
      filterProductStockHistoryPanelFormElements,
      setFilterProductStockHistoryPanelFormElements,
    ]
  );

  useMemo(() => {
    setCurrentPage(1);
  }, [filterProductStockHistoryPanelFormElements, setCurrentPage]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
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
