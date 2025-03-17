import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { ButtonCall, commonDateOptions } from "../types";
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

type FormElementsState = {
  [key: string]: any;
};

export default function ButtonCalls() {
  const { t } = useTranslation();
  const locations = useGetAllLocations();
  const users = useGetUsers();
  const buttonCalls = useGetButtonCalls();
  const [showFilters, setShowFilters] = useState(true);
  const allRows = useGetButtonCalls().map((buttonCall) => {
      return {
        ...buttonCall,
        location: getItem(buttonCall.location, locations)?.name ?? 0,
        cancelledBy: getItem(buttonCall.cancelledBy, users)?.name ?? '',
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
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
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
        return row.location;
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
        return row.cancelledBy;
      },
    },
  ];

  useEffect(() => {
    setRows(allRows);
    console.log(allRows);
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
