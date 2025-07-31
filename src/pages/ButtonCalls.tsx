import { size } from "lodash";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { InputTypes } from "../components/panelComponents/shared/types";
import { ButtonCall, buttonCallTypes, commonDateOptions } from "../types";
import {
  useButtonCallMutations,
  useGetButtonCalls,
} from "../utils/api/buttonCall";
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
  const [showButtonCallsFilters, setShowButtonCallsFilters] = useState(true);
  const [isButtonCallEnableEdit, setIsButtonCallEnableEdit] = useState(false);
  const allRows = useGetButtonCalls()
    ?.map((buttonCall) => {
      return {
        ...buttonCall,
        locationName: getItem(buttonCall.location, locations)?.name ?? 0,
        cancelledByName: getItem(buttonCall.cancelledBy, users)?.name ?? "",
        type: buttonCall?.type ?? buttonCallTypes[0].value,
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
      type: [],
    });
  const filterPanelInputs = [
    StockLocationInput({ locations: locations }),
    {
      type: InputTypes.SELECT,
      formKey: "cancelledBy",
      label: t("Cancelled By"),
      options: users?.map((user) => ({
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
      formKey: "type",
      label: t("Type"),
      options: buttonCallTypes?.map((item) => {
        return {
          value: item.value,
          label: t(item.label),
        };
      }),
      placeholder: t("Type"),
      isMultiple: true,
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "date",
      label: t("Date"),
      options: commonDateOptions?.map((option) => {
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
    { key: t("Type"), isSortable: true },
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
    {
      key: "type",
      className: "min-w-32 pr-1",
      node: (row: any) => {
        let type = buttonCallTypes.find((item) => item.value === row.type);
        if (!type) type = buttonCallTypes[0];
        return (
          <div
            className={`w-fit rounded-md text-sm  px-2 py-1 font-semibold  ${type?.backgroundColor} text-white`}
          >
            {t(type?.label)}
          </div>
        );
      },
    },
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
      label: t("Enable Edit"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={isButtonCallEnableEdit}
          onChange={() => {
            setIsButtonCallEnableEdit(!isButtonCallEnableEdit);
          }}
        />
      ),
    },
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showButtonCallsFilters}
          onChange={setShowButtonCallsFilters}
        />
      ),
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showButtonCallsFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowButtonCallsFilters(false),
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
        (filterPanelFormElements?.type?.length === 0 ||
          filterPanelFormElements?.type?.includes(row.type)) &&
        (size(filterPanelFormElements.cancelledBy) == 0 ||
          filterPanelFormElements.cancelledBy?.includes(row.cancelledBy)) &&
        passesFilter(filterPanelFormElements.location, row.location)
      );
    });
    setRows(filteredRows);
    setTableKey((prev) => prev + 1);
  }, [filterPanelFormElements, locations, buttonCalls]);

  const { deleteButtonCall } = useButtonCallMutations();
  const [rowToAction, setRowToAction] = useState<any>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const actions = [
    {
      name: t("Delete"),
      isDisabled: !isButtonCallEnableEdit,
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            deleteButtonCall(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title="Delete Button Call"
          text={`Table ${rowToAction?.tableName} button call between ${rowToAction?.startHour} - ${rowToAction?.finishHour} will be deleted. Are you sure you want to continue?`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl  ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
  ];
  return (
    <>
      <Header showLocationSelector={true} />
      <div className="w-[98%] mx-auto my-10">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          filters={tableFilters}
          columns={
            isButtonCallEnableEdit
              ? [{ key: t("Action"), isSortable: false }, ...columns]
              : columns
          }
          filterPanel={filterPanel}
          rows={rows ?? []}
          title={t("Button Calls")}
          actions={actions}
          isActionsActive={isButtonCallEnableEdit}
          isActionsAtFront={isButtonCallEnableEdit}
        />
      </div>
    </>
  );
}
