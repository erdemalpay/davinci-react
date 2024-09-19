import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../context/Order.context";
import { OrderCollectionStatus, TURKISHLIRA, Table } from "../../types";
import { useGetAccountPaymentMethods } from "../../utils/api/account/paymentMethod";
import { useGetLocations } from "../../utils/api/location";
import { useGetAllOrderCollections } from "../../utils/api/order/orderCollection";
import { formatAsLocalDate } from "../../utils/format";
import { LocationInput } from "../../utils/panelInputs";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

const DailyIncome = () => {
  const { t } = useTranslation();
  const collections = useGetAllOrderCollections();
  const [tableKey, setTableKey] = useState(0);
  const locations = useGetLocations();
  const paymentMethods = useGetAccountPaymentMethods();
  if (!collections || !locations || !paymentMethods) {
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
      if (
        filterPanelFormElements.location !== "" &&
        filterPanelFormElements.location !== collection.location
      ) {
        return acc;
      }
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
        paymentMethods.forEach((method) => {
          if (collection.paymentMethod === method._id) {
            existingEntry[method._id] =
              (existingEntry[method._id] || 0) + collection.amount;
          }
        });
        existingEntry.total += collection.amount;
      } else {
        const newEntry: any = {
          date: format(tableDate, "yyyy-MM-dd"),
          formattedDate: formatAsLocalDate(format(tableDate, "yyyy-MM-dd")),
          location: collection.location,
          total: collection.amount,
        };

        paymentMethods.forEach((method) => {
          newEntry[method._id] =
            collection.paymentMethod === method._id ? collection.amount : 0;
        });

        acc.push(newEntry);
      }
      return acc;
    }, [] as any[]);

  allRows.push({
    date: t("Total"),
    formattedDate: t("Total"),
    location: 0,
    paymentMethod: "",
    ...paymentMethods.reduce((acc, method) => {
      acc[method._id] = allRows.reduce((sum, row) => sum + row[method._id], 0);
      return acc;
    }, {} as any),
    total: allRows.reduce((acc, row) => acc + row.total, 0),
    className: "font-semibold",
    isSortable: false,
  });

  const [rows, setRows] = useState(allRows);
  const paymentMethodColumns = paymentMethods.map((method) => ({
    key: t(method.name),
    isSortable: true,
  }));
  const columns = [
    { key: t("Date"), isSortable: true },
    ...paymentMethodColumns,
    { key: t("Total"), isSortable: true },
  ];

  const paymentMethodRowKeys = paymentMethods.map((method) => ({
    key: method._id,
    node: (row: any) => {
      return (
        <p className={`${row?.className}`}>
          {row[method._id] > 0 &&
            row[method._id].toFixed(2) + " " + TURKISHLIRA}
        </p>
      );
    },
  }));
  const rowKeys = [
    {
      key: "date",
      className: "min-w-32 pr-2",
      node: (row: any) => {
        return <p className={`${row?.className}`}>{row.formattedDate}</p>;
      },
    },
    ...paymentMethodRowKeys,
    {
      key: "total",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`}>
            {row.total > 0 && row.total.toFixed(2) + " " + TURKISHLIRA}
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
  }, [collections, locations, filterPanelFormElements, paymentMethods]);
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
