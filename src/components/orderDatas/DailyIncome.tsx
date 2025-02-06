import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../context/Order.context";
import {
  commonDateOptions,
  DateRangeKey,
  OrderCollectionStatus,
  TURKISHLIRA,
} from "../../types";
import { useGetAccountPaymentMethods } from "../../utils/api/account/paymentMethod";
import { dateRanges } from "../../utils/api/dateRanges";
import { Paths } from "../../utils/api/factory";
import { useGetAllLocations } from "../../utils/api/location";
import { useGetAllOrderCollections } from "../../utils/api/order/orderCollection";
import { formatAsLocalDate } from "../../utils/format";
import { LocationInput } from "../../utils/panelInputs";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";
const DailyIncome = () => {
  const { t } = useTranslation();
  const collections = useGetAllOrderCollections();
  const [tableKey, setTableKey] = useState(0);
  const locations = useGetAllLocations();
  const queryClient = useQueryClient();
  const paymentMethods = useGetAccountPaymentMethods();
  if (!collections || !locations || !paymentMethods) {
    return null;
  }
  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
    showOrderDataFilters,
    setShowOrderDataFilters,
  } = useOrderContext();
  const allRows = collections
    ?.filter(
      (collection) => collection.status !== OrderCollectionStatus.CANCELLED
    )
    ?.reduce((acc, collection) => {
      const zonedTime = toZonedTime(collection.createdAt, "UTC");
      const tableDate = format(zonedTime, "yyyy-MM-dd");
      if (!collection || !tableDate) return acc;
      const existingEntry = acc.find((item) => item.date === tableDate);
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
          date: tableDate,
          formattedDate: formatAsLocalDate(tableDate),
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
    total: allRows.reduce((acc, row) => acc + row?.total, 0),
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
          {row[method._id] !== 0 &&
            row[method._id]?.toFixed(2) + " " + TURKISHLIRA}
        </p>
      );
    },
  }));
  const rowKeys = [
    {
      key: "date",
      className: "min-w-32 pr-2",
      node: (row: any) => {
        return <p className={`${row?.className}`}>{row?.formattedDate}</p>;
      },
    },
    ...paymentMethodRowKeys,
    {
      key: "total",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`}>
            {row?.total !== 0 && row?.total?.toFixed(2) + " " + TURKISHLIRA}
          </p>
        );
      },
    },
  ];
  const filterPanelInputs = [
    LocationInput({ locations: locations, required: true, isMultiple: true }),
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
      additionalOnChange: ({
        value,
        label,
      }: {
        value: string;
        label: string;
      }) => {
        const dateRange = dateRanges[value as DateRangeKey];
        if (dateRange) {
          setFilterPanelFormElements({
            ...filterPanelFormElements,
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
      invalidateKeys: [{ key: "date", defaultValue: "" }],
      isOnClearActive: false,
    },
    {
      type: InputTypes.DATE,
      formKey: "before",
      label: t("End Date"),
      placeholder: t("End Date"),
      required: true,
      isDatePicker: true,
      invalidateKeys: [{ key: "date", defaultValue: "" }],
      isOnClearActive: false,
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showOrderDataFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowOrderDataFilters(false),
    additionalFilterCleanFunction: () => {
      setFilterPanelFormElements(initialFilterPanelFormElements);
    },
  };
  const filters = [
    {
      isUpperSide: false,
      node: (
        <ButtonFilter
          buttonName={t("Refresh Data")}
          onclick={() => {
            queryClient.invalidateQueries([`${Paths.Order}/query`]);
            queryClient.invalidateQueries([`${Paths.Order}/collection/query`]);
          }}
        />
      ),
    },
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showOrderDataFilters}
          onChange={() => {
            setShowOrderDataFilters(!showOrderDataFilters);
          }}
        />
      ),
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
