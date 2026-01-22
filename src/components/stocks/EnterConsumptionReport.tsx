import { format } from "date-fns";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useFilterContext } from "../../context/Filter.context";
import { useGeneralContext } from "../../context/General.context";
import { DateRangeKey, TURKISHLIRA, commonDateOptions } from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetAggregatedAccountProductStockHistorys } from "../../utils/api/account/productStockHistory";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetStockLocations } from "../../utils/api/location";
import { useGetCategories } from "../../utils/api/menu/category";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

const EnterConsumptionReport = () => {
  const { t } = useTranslation();
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const {
    filterEnterConsumptionPanelFormElements,
    setFilterEnterConsumptionPanelFormElements,
    showEnterConsumptionFilters,
    setShowEnterConsumptionFilters,
  } = useFilterContext();

  const stockHistoriesPayload = useGetAggregatedAccountProductStockHistorys(
    currentPage,
    rowsPerPage,
    filterEnterConsumptionPanelFormElements
  );

  const categories = useGetCategories();
  const vendors = useGetAccountVendors();
  const brands = useGetAccountBrands();
  const products = useGetAccountProducts();
  const expenseTypes = useGetAccountExpenseTypes();
  const locations = useGetStockLocations();

  const rows = useMemo(() => {
    return (
      stockHistoriesPayload?.data?.map((item: any) => {
        const product = item.productDetails;
        const locationName = getItem(item.location, locations)?.name || "";

        return {
          ...item,
          productName: product?.name || "",
          locationName,
          totalChange: item.totalChange || 0,
          entryCount: item.entryCount || 0,
          firstEntryDate: item.firstEntry
            ? formatAsLocalDate(format(new Date(item.firstEntry), "yyyy-MM-dd"))
            : "",
          lastEntryDate: item.lastEntry
            ? formatAsLocalDate(format(new Date(item.lastEntry), "yyyy-MM-dd"))
            : "",
          totalCost: product?.unitPrice
            ? Math.abs(item.totalChange || 0) * product.unitPrice
            : 0,
          unitPrice: product?.unitPrice || 0,
        };
      }) || []
    );
  }, [stockHistoriesPayload, locations]);

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
        formKey: "category",
        label: t("Category"),
        options: categories?.map((category) => {
          return {
            value: category._id,
            label: category.name,
          };
        }),
        invalidateKeys: [{ key: "product", defaultValue: "" }],
        isMultiple: true,
        placeholder: t("Category"),
        required: false,
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
        formKey: "date",
        label: t("Date"),
        options: commonDateOptions.map((option) => ({
          value: option.value,
          label: t(option.label),
        })),
        placeholder: t("Date"),
        required: true,
        additionalOnChange: ({
          value,
          label,
        }: {
          value: string;
          label: string;
        }) => {
          const dateRange = dateRanges[value as DateRangeKey];
          if (dateRange) {
            setFilterEnterConsumptionPanelFormElements({
              ...filterEnterConsumptionPanelFormElements,
              ...dateRange(),
            });
          }
        },
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
    [
      expenseTypes,
      products,
      vendors,
      brands,
      locations,
      t,
      categories,
      filterEnterConsumptionPanelFormElements,
      setFilterEnterConsumptionPanelFormElements,
    ]
  );

  const columns = useMemo(
    () => [
      {
        key: t("Product"),
        isSortable: true,
        correspondingKey: "productName",
      },
      {
        key: t("Location"),
        isSortable: true,
        correspondingKey: "locationName",
      },
      {
        key: t("Unit Price"),
        isSortable: true,
        correspondingKey: "unitPrice",
      },
      {
        key: t("Total Change"),
        isSortable: true,
        correspondingKey: "totalChange",
      },
      {
        key: t("Total Cost"),
        isSortable: true,
        correspondingKey: "totalCost",
      },
      {
        key: t("First Entry"),
        isSortable: true,
        correspondingKey: "firstEntry",
      },
      {
        key: t("Last Entry"),
        isSortable: true,
        correspondingKey: "lastEntry",
      },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "productName",
        className: "min-w-32 pr-1",
      },
      {
        key: "locationName",
        className: "min-w-32 pr-1",
      },
      {
        key: "unitPrice",
        className: "min-w-32 pr-1",
        node: (row: any) => (
          <p>
            {row.unitPrice.toFixed(2)}
            {TURKISHLIRA}
          </p>
        ),
      },
      {
        key: "totalChange",
        className: "min-w-32 pr-1",
        node: (row: any) => (
          <p
            className={row.totalChange < 0 ? "text-red-500 font-semibold" : ""}
          >
            {row.totalChange}
          </p>
        ),
      },
      {
        key: "totalCost",
        className: "min-w-32 pr-1",
        node: (row: any) => (
          <p className="text-red-500 font-semibold">
            {row.totalCost.toFixed(2)}
            {TURKISHLIRA}
          </p>
        ),
      },
      {
        key: "firstEntryDate",
        className: "min-w-32 pr-1",
      },
      {
        key: "lastEntryDate",
        className: "min-w-32 pr-1",
      },
    ],
    []
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showEnterConsumptionFilters}
            onChange={() => {
              setShowEnterConsumptionFilters(!showEnterConsumptionFilters);
            }}
          />
        ),
      },
    ],
    [t, showEnterConsumptionFilters, setShowEnterConsumptionFilters]
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
      isFilterPanelActive: showEnterConsumptionFilters,
      inputs: filterPanelInputs,
      formElements: filterEnterConsumptionPanelFormElements,
      setFormElements: setFilterEnterConsumptionPanelFormElements,
      closeFilters: () => setShowEnterConsumptionFilters(false),
    }),
    [
      showEnterConsumptionFilters,
      filterPanelInputs,
      filterEnterConsumptionPanelFormElements,
      setFilterEnterConsumptionPanelFormElements,
      setShowEnterConsumptionFilters,
    ]
  );

  const outsideSort = useMemo(
    () => ({
      filterPanelFormElements: filterEnterConsumptionPanelFormElements,
      setFilterPanelFormElements: setFilterEnterConsumptionPanelFormElements,
    }),
    [
      filterEnterConsumptionPanelFormElements,
      setFilterEnterConsumptionPanelFormElements,
    ]
  );

  const outsideSearchProps = useMemo(() => {
    return {
      t,
      filterPanelFormElements: filterEnterConsumptionPanelFormElements,
      setFilterPanelFormElements: setFilterEnterConsumptionPanelFormElements,
    };
  }, [
    t,
    filterEnterConsumptionPanelFormElements,
    setFilterEnterConsumptionPanelFormElements,
  ]);

  // Reset current page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [filterEnterConsumptionPanelFormElements, setCurrentPage]);

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        columns={columns}
        outsideSortProps={outsideSort}
        outsideSearchProps={outsideSearchProps}
        rows={rows}
        filterPanel={filterPanel}
        filters={filters}
        isSearch={false}
        title={t("Consumption Report")}
        isActionsActive={false}
        {...(pagination && { pagination })}
        isAllRowPerPageOption={false}
      />
    </div>
  );
};

export default EnterConsumptionReport;
