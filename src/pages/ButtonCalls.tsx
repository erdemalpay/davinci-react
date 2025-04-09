import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { ButtonCall } from "../types";
import { formatAsLocalDate } from "../utils/format";
import { useGetButtonCalls } from "../utils/api/buttonCall";
import { useTranslation } from "react-i18next";
import { useGetUsers } from "../utils/api/user";
import { getItem } from "../utils/getItem";
import { useGetAllLocations } from "../utils/api/location";
import { useEffect, useState } from "react";
import { InputTypes } from "../components/panelComponents/shared/types";
import { StockLocationInput } from "../utils/panelInputs";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { passesFilter } from "../utils/passesFilter";
import { size } from "lodash";

type FormElementsState = {
  [key: string]: any;
};

export default function ButtonCalls() {
  const { t } = useTranslation();
  const locations = useGetAllLocations();
  const [tableKey, setTableKey] = useState(0);
  const users = useGetUsers();
  const buttonCalls = useGetButtonCalls();
  const [showFilters, setShowFilters] = useState(true);
  const allRows = useGetButtonCalls().map((buttonCall) => {
      return {
        ...buttonCall,
        locationName: getItem(buttonCall.location, locations)?.name ?? 0,
        cancelledByName: getItem(buttonCall.cancelledBy, users)?.name ?? '',
      };
    })
    ?.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  const [rows, setRows] = useState(allRows);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      location: "",
      date: "",
      before: "",
      after: "",
      sort: "",
      asc: 1,
      search: "",
    });

  const filterPanelInputs = [
    StockLocationInput({ locations: locations }),
    {
      type: InputTypes.SELECT,
      formKey: "cancelledBy",
      label: t("Cancelled By"),
      options: users.map((user) => ({
        value: user._id,
        label: user.name,
      })),
      placeholder: t("Brand"),
      isDisabled: false,
      isMultiple: true,
      required: false,
    },
    {
      type: InputTypes.TEXT,
      formKey: "tableName",
      label: t("Table Name"),
      placeholder: t("Table Name"),
      required: true,
      isDatePicker: false,
      invalidateKeys: [{ key: "tableName", defaultValue: "" }],
      isOnClearActive: false,
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
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
    isApplyButtonActive: true,
  };

  const tableFilters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];

  const rowKeys = [
    {
      key: "date",
      className: "min-w-32",
      node: (row: ButtonCall) => {
        return formatAsLocalDate(row.date);
      },
    },
    {
      key: "location",
      className: "min-w-32",
      node: (row: ButtonCall) => {
        return row.locationName;
      },
    },
    { key: "tableName", className: "min-w-40 pr-1" },
    {
      key: "startHour",
      className: "min-w-32",
      node: (row: ButtonCall) => {
        return row.startHour;
      },
    },
    {
      key: "finishHour",
      className: "min-w-32",
      node: (row: ButtonCall) => {
        return row.finishHour ?? '';
      },
    },
    {
      key: "duration",
      className: "min-w-32",
      node: (row: ButtonCall) => {
        return row.duration ?? '';
      },
    },
    {
      key: "callCount",
      className: "min-w-32",
      node: (row: ButtonCall) => {
        return row.callCount ?? '';
      },
    },
    {
      key: "cancelledBy",
      className: "min-w-32",
      node: (row: ButtonCall) => {
        return row.cancelledByName;
      },
    },
  ];

  useEffect(() => {
    const filteredRows = allRows.filter((row) => {
      if (!row?.date) {
        return false;
      }
      console.log(size(filterPanelFormElements.cancelledBy));
      console.log(filterPanelFormElements.cancelledBy, " - ", row.cancelledBy);
      return (
        (filterPanelFormElements.before === "" ||
          row.date <= filterPanelFormElements.before) &&
        (filterPanelFormElements.after === "" ||
          row.date >= filterPanelFormElements.after) &&
        (!filterPanelFormElements.tableName ||
        passesFilter(filterPanelFormElements.tableName, row.tableName)) &&
        (size(filterPanelFormElements.cancelledBy) == 0 ||
          filterPanelFormElements.cancelledBy.includes(row.cancelledBy)) &&
        passesFilter(filterPanelFormElements.location, row.location)
      );
    });
    setRows(filteredRows);
    setTableKey((prev) => prev + 1);
  }, [
    filterPanelFormElements,
    locations,
    buttonCalls,
  ]);

  const columns = [
    { key: t("Date"), isSortable: true, correspondingKey: "date" },
    { key: t("Location"), isSortable: true, correspondingKey: "location" },
    { key: t("Table Name"), isSortable: true, correspondingKey: "tableName" },
    { key: t("Start Hour"), isSortable: true, correspondingKey: "startHour" },
    { key: t("Finish Hour"), isSortable: true, correspondingKey: "finishHour" },
    { key: t("Duration"), isSortable: true },
    { key: t("Call Count"), isSortable: true },
    { key: t("Cancelled By"), isSortable: false },
  ];

  return (
    <>
      <Header showLocationSelector={true} />
      <div className="w-[98%] mx-auto my-10">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          filters={tableFilters}
          isActionsActive={false}
          columns={columns}
          filterPanel={filterPanel}
          rows={rows ?? []}
          title={t("Button Calls")}
        />
      </div>
    </>
  );
}
