import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../context/Order.context";
import {
  ConstantPaymentMethodsIds,
  Location,
  OrderCollectionStatus,
  TURKISHLIRA,
  Table,
} from "../../types";
import { useGetLocations } from "../../utils/api/location";
import { useGetAllOrderCollections } from "../../utils/api/order/orderCollection";
import { formatAsLocalDate } from "../../utils/format";
import { LocationInput } from "../../utils/panelInputs";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

type AllRows = {
  date: string;
  formattedDate: string;
  location: number;
  paymentMethod: string;
  cash: number;
  creditCard: number;
  bankTransfer: number;
  total: number;
  className?: string;
  isSortable?: boolean;
};
const DailyIncome = () => {
  const { t } = useTranslation();
  const collections = useGetAllOrderCollections();
  const [tableKey, setTableKey] = useState(0);
  const locations = useGetLocations();
  if (!collections || !locations) {
    return null;
  }
  const [showFilters, setShowFilters] = useState(false);
  const { filterPanelFormElements, setFilterPanelFormElements } =
    useOrderContext();
  const allRows = collections
    ?.filter(
      (collection) => collection.status !== OrderCollectionStatus.CANCELLED
    )
    ?.reduce((acc, collection) => {
      const tableDate = (collection.table as Table)?.date;
      if (!collection || !tableDate) return acc;
      // location filter
      if (
        filterPanelFormElements.location !== "" &&
        filterPanelFormElements.location !==
          (collection.location as Location)._id
      ) {
        return acc;
      }
      // other filters
      if (
        (filterPanelFormElements.before !== "" &&
          format(tableDate, "yyyy-MM-dd") > filterPanelFormElements.before) ||
        (filterPanelFormElements.after !== "" &&
          format(tableDate, "yyyy-MM-dd") < filterPanelFormElements.after)
      ) {
        return acc;
      }
      const existingEntry = acc.find(
        (item) => item.date === format(tableDate, "yyyy-MM-dd")
      );
      if (existingEntry) {
        if (collection.paymentMethod === ConstantPaymentMethodsIds.CASH) {
          existingEntry.cash += collection.amount;
        } else if (
          collection.paymentMethod === ConstantPaymentMethodsIds.CREDITCARD
        ) {
          existingEntry.creditCard += collection.amount;
        } else if (
          collection.paymentMethod === ConstantPaymentMethodsIds.BANKTRANSFER
        ) {
          existingEntry.bankTransfer += collection.amount;
        }
        existingEntry.total += collection.amount;
      } else {
        acc.push({
          date: format(tableDate, "yyyy-MM-dd"),
          formattedDate: formatAsLocalDate(format(tableDate, "yyyy-MM-dd")),
          location: (collection.location as Location)._id,
          paymentMethod: collection.paymentMethod,
          cash:
            collection.paymentMethod === ConstantPaymentMethodsIds.CASH
              ? collection.amount
              : 0,
          creditCard:
            collection.paymentMethod === ConstantPaymentMethodsIds.CREDITCARD
              ? collection.amount
              : 0,
          bankTransfer:
            collection.paymentMethod === ConstantPaymentMethodsIds.BANKTRANSFER
              ? collection.amount
              : 0,
          total: collection.amount,
        });
      }
      return acc;
    }, [] as AllRows[]);
  allRows.push({
    date: t("Total"),
    formattedDate: t("Total"),
    location: 0,
    paymentMethod: "",
    cash: allRows.reduce((acc, row) => acc + row.cash, 0),
    creditCard: allRows.reduce((acc, row) => acc + row.creditCard, 0),
    bankTransfer: allRows.reduce((acc, row) => acc + row.bankTransfer, 0),
    total: allRows.reduce((acc, row) => acc + row.total, 0),
    className: "font-semibold",
    isSortable: false,
  });

  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Date"), isSortable: true },
    { key: t("Cash"), isSortable: true },
    { key: t("Credit Card"), isSortable: true },
    { key: t("Bank Transfer"), isSortable: true },
    { key: t("Total"), isSortable: true },
  ];
  const rowKeys = [
    {
      key: "date",
      className: "min-w-32 pr-2 ",
      node: (row: any) => {
        return <p className={`${row?.className}`}>{row.formattedDate}</p>;
      },
    },
    {
      key: "cash",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`}>
            {row.cash > 0 && row.cash + " " + TURKISHLIRA}
          </p>
        );
      },
    },
    {
      key: "creditCard",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`}>
            {row.creditCard > 0 && row.creditCard + " " + TURKISHLIRA}
          </p>
        );
      },
    },
    {
      key: "bankTransfer",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`}>
            {row.bankTransfer > 0 && row.bankTransfer + " " + TURKISHLIRA}
          </p>
        );
      },
    },
    {
      key: "total",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`}>
            {row.total > 0 && row.total + " " + TURKISHLIRA}
          </p>
        );
      },
    },
  ];
  const filterPanelInputs = [
    LocationInput({ locations: locations, required: true }),
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
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [collections, locations, filterPanelFormElements]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          filters={filters}
          filterPanel={filterPanel}
          title={t("Daily Income")}
          isActionsActive={false}
        />
      </div>
    </>
  );
};

export default DailyIncome;
