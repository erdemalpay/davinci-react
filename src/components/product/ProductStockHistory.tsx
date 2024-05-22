import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccountProduct, AccountStockLocation } from "../../types";
import { useGetAccountProductStockHistorys } from "../../utils/api/account/productStockHistory";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { StockLocationInput } from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";

type FormElementsState = {
  [key: string]: any;
};
export const StockHistoryStatusEnumObject = {
  "expense entry": {
    label: "Expense Entry",
    backgroundColor: "bg-green-500",
  },
  "stock entry": {
    label: "Stock Entry",
    backgroundColor: "bg-blue-500",
  },
  consumpt: {
    label: "Consumption",
    backgroundColor: "bg-purple-500",
  },
  "update create": {
    label: "Update Create",
    backgroundColor: "bg-yellow-700",
  },
  "update delete": {
    label: "Update Delete",
    backgroundColor: "bg-orange-500",
  },
  "stock delete": {
    label: "Stock Delete",
    backgroundColor: "bg-red-700",
  },
};
type Props = {
  selectedProduct: AccountProduct;
};
const ProductStockHistory = ({ selectedProduct }: Props) => {
  const { t } = useTranslation();
  const stockHistories = useGetAccountProductStockHistorys();
  const [tableKey, setTableKey] = useState(0);
  const locations = useGetAccountStockLocations();
  const [showFilters, setShowFilters] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      location: "",
      status: "",
      before: "",
      after: "",
    });
  const pad = (num: number) => (num < 10 ? `0${num}` : num);
  const [rows, setRows] = useState(() => {
    return stockHistories
      .filter((item) => item.product._id === selectedProduct._id)
      .map((stockHistory) => {
        const date = new Date(stockHistory.createdAt);
        return {
          ...stockHistory,
          prdct: stockHistory.product?.name,
          pckgTyp: stockHistory?.packageType?.name,
          lctn: stockHistory?.location?.name,
          usr: stockHistory?.user?.name,
          date: `${pad(date.getDate())}-${pad(
            date.getMonth() + 1
          )}-${date.getFullYear()}`,
          hour: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
        };
      });
  });
  const filterPanelInputs = [
    StockLocationInput({ locations: locations }),
    {
      type: InputTypes.SELECT,
      formKey: "status",
      label: t("Status"),
      options: Object.entries(StockHistoryStatusEnumObject).map(
        ([key, status]) => {
          return {
            value: key,
            label: t(status.label),
          };
        }
      ),
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
  const columns = [
    { key: t("Date"), isSortable: true },
    { key: t("Hour"), isSortable: true },
    { key: t("User"), isSortable: true },
    { key: t("Product"), isSortable: true },
    { key: t("Package Type"), isSortable: true },
    { key: t("Location"), isSortable: true },
    { key: t("Old Quantity"), isSortable: true },
    { key: t("Changed"), isSortable: true },
    { key: t("Status"), isSortable: true },
  ];
  const rowKeys = [
    {
      key: "date",
      className: "min-w-32 pr-1",
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
      key: "pckgTyp",
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
      key: "status",
      className: "min-w-32 pr-1",
      node: (row: any) => {
        const status =
          StockHistoryStatusEnumObject[
            row.status as keyof typeof StockHistoryStatusEnumObject
          ];
        return (
          <div
            className={`w-fit rounded-md text-sm ml-2 px-2 py-1 font-semibold  ${status?.backgroundColor} text-white`}
          >
            {t(status?.label)}
          </div>
        );
      },
    },
  ];
  useEffect(() => {
    setRows(
      stockHistories
        .filter((item) => item.product._id === selectedProduct._id)
        .filter((stockHistory) => {
          return (
            (filterPanelFormElements.before === "" ||
              stockHistory.createdAt <= filterPanelFormElements.before) &&
            (filterPanelFormElements.after === "" ||
              stockHistory.createdAt >= filterPanelFormElements.after) &&
            passesFilter(
              filterPanelFormElements.location,
              (stockHistory.location as AccountStockLocation)?._id
            ) &&
            passesFilter(filterPanelFormElements.status, stockHistory.status)
          );
        })
        .map((stockHistory) => {
          const date = new Date(stockHistory.createdAt);
          return {
            ...stockHistory,
            prdct: stockHistory.product?.name,
            pckgTyp: stockHistory?.packageType?.name,
            lctn: stockHistory?.location?.name,
            usr: stockHistory?.user?.name,
            date: `${pad(date.getDate())}-${pad(
              date.getMonth() + 1
            )}-${date.getFullYear()}`,
            hour: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
          };
        })
    );
    setTableKey((prev) => prev + 1);
  }, [stockHistories, filterPanelFormElements, selectedProduct]);

  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
  };
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          filterPanel={filterPanel}
          filters={filters}
          title={t("Product Stock History")}
        />
      </div>
    </>
  );
};

export default ProductStockHistory;
