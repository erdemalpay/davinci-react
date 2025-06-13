import { size } from "lodash";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { InputTypes } from "../components/panelComponents/shared/types";
import { ButtonCall, commonDateOptions } from "../types";
import { useGetButtonCalls } from "../utils/api/buttonCall";
import { useGetAllLocations } from "../utils/api/location";
import { useGetUsers } from "../utils/api/user";
import { formatAsLocalDate } from "../utils/format";
import { getItem } from "../utils/getItem";
import { StockLocationInput } from "../utils/panelInputs";
import { passesFilter } from "../utils/passesFilter";

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
  const allRows = useGetButtonCalls()
    .map((buttonCall) => {
      return {
        ...buttonCall,
        locationName: getItem(buttonCall.location, locations)?.name ?? 0,
        cancelledByName: getItem(buttonCall.cancelledBy, users)?.name ?? "",
      };
    })
    ?.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  const [rows, setRows] = useState(allRows);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      location: "",
      cancelledBy: [],
      tableName: "",
      date: "",
      before: "",
      after: "",
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
      placeholder: t("Cancelled By"),
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
      isOnClearActive: false,
      isDebounce: true,
    },
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
  const columns = [
    { key: t("Date"), isSortable: true },
    { key: t("Location"), isSortable: true },
    { key: t("Table Name"), isSortable: true },
    { key: t("Start Hour"), isSortable: true },
    { key: t("Finish Hour"), isSortable: true },
    { key: t("Duration"), isSortable: true },
    { key: t("Call Count"), isSortable: true },
    { key: t("Cancelled By"), isSortable: false },
  ];
  const rowKeys = [
    {
      key: "date",
      className: "min-w-32",
      node: (row: ButtonCall) => {
        return formatAsLocalDate(row.date);
      },
    },
    { key: "locationName", className: "min-w-32" },
    { key: "tableName" },
    { key: "startHour" },
    { key: "finishHour" },
    { key: "duration" },
    { key: "callCount" },
    {
      key: "cancelledByName",
      className: "min-w-32",
    },
  ];
  const tableFilters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
    isApplyButtonActive: false,
  };
  useEffect(() => {
    const filteredRows = allRows.filter((row) => {
      if (!row?.date) {
        return false;
      }
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
  }, [filterPanelFormElements, locations, buttonCalls]);
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
