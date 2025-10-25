import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import {
  ActionEnum,
  ButtonCall,
  DisabledConditionEnum,
  buttonCallTypes,
  commonDateOptions,
} from "../types";
import {
  useButtonCallMutations,
  useGetQueryButtonCalls,
} from "../utils/api/buttonCall";
import { dateRanges } from "../utils/api/dateRanges";
import { useGetAllLocations } from "../utils/api/location";
import { useGetDisabledConditions } from "../utils/api/panelControl/disabledCondition";
import { useGetUsers } from "../utils/api/user";
import { formatAsLocalDate } from "../utils/format";
import { getItem } from "../utils/getItem";

type FormElementsState = {
  [key: string]: any;
};

export default function ButtonCalls() {
  const { t } = useTranslation();
  const locations = useGetAllLocations();
  const users = useGetUsers();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();

  const initialFilterPanelFormElements: FormElementsState = {
    location: "",
    cancelledBy: [],
    tableName: "",
    date: "thisMonth",
    before: dateRanges.thisMonth().before,
    after: dateRanges.thisMonth().after,
    type: [],
    sort: "",
    asc: 1,
  };
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFilterPanelFormElements);
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const buttonCallsPayload = useGetQueryButtonCalls(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );
  const [showButtonCallsFilters, setShowButtonCallsFilters] = useState(true);
  const [isButtonCallEnableEdit, setIsButtonCallEnableEdit] = useState(false);
  const [rowToAction, setRowToAction] = useState<any>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);

  const buttonCallsPageDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.BUTTONCALLS_BUTTONCALLS,
      disabledConditions
    );
  }, [disabledConditions]);

  const rows = useMemo(() => {
    const allRows = buttonCallsPayload?.data
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
    return allRows || [];
  }, [buttonCallsPayload, locations, users]);

  const columns = useMemo(() => {
    const baseColumns = [
      { key: t("Date"), isSortable: true, correspondingKey: "createdAt" },
      { key: t("Location"), isSortable: true, correspondingKey: "location" },
      { key: t("Type"), isSortable: true, correspondingKey: "type" },
      { key: t("Table Name"), isSortable: true, correspondingKey: "tableName" },
      { key: t("Start Hour"), isSortable: true, correspondingKey: "startHour" },
      {
        key: t("Finish Hour"),
        isSortable: true,
        correspondingKey: "finishHour",
      },
      { key: t("Duration"), isSortable: true, correspondingKey: "duration" },
      { key: t("Call Count"), isSortable: true, correspondingKey: "callCount" },
      {
        key: t("Cancelled By"),
        isSortable: false,
        correspondingKey: "cancelledBy",
      },
    ];
    return isButtonCallEnableEdit
      ? [{ key: t("Action"), isSortable: false }, ...baseColumns]
      : baseColumns;
  }, [t, isButtonCallEnableEdit]);

  const rowKeys = useMemo(
    () => [
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
    ],
    [t]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: locations.map((input) => ({
          value: input._id,
          label: input.name,
        })),
        placeholder: t("Location"),
        required: true,
      },
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
    ],
    [t, locations, users]
  );

  const { deleteButtonCall } = useButtonCallMutations();

  const isEnableEditDisabled = useMemo(() => {
    return (
      buttonCallsPageDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.ENABLEEDIT &&
          user?.role?._id &&
          !ac?.permissionsRoles?.includes(user?.role?._id)
      ) ?? false
    );
  }, [buttonCallsPageDisabledCondition, user]);

  const actions = useMemo(
    () => [
      {
        name: t("Delete"),
        isDisabled:
          buttonCallsPageDisabledCondition?.actions?.some(
            (ac) =>
              ac.action === ActionEnum.DELETE &&
              user?.role?._id &&
              !ac?.permissionsRoles?.includes(user?.role?._id)
          ) ?? false,
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
    ],
    [
      t,
      buttonCallsPageDisabledCondition,
      user,
      rowToAction,
      isCloseAllConfirmationDialogOpen,
      deleteButtonCall,
    ]
  );

  const tableFilters = useMemo(
    () => [
      ...(!isEnableEditDisabled
        ? [
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
          ]
        : []),
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
    ],
    [t, isEnableEditDisabled, isButtonCallEnableEdit, showButtonCallsFilters]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showButtonCallsFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      closeFilters: () => setShowButtonCallsFilters(false),
      isApplyButtonActive: false,
      additionalFilterCleanFunction: () => {
        setFilterPanelFormElements(initialFilterPanelFormElements);
      },
    }),
    [
      showButtonCallsFilters,
      filterPanelInputs,
      filterPanelFormElements,
      setFilterPanelFormElements,
      initialFilterPanelFormElements,
    ]
  );

  const outsideSort = useMemo(
    () => ({
      filterPanelFormElements: filterPanelFormElements,
      setFilterPanelFormElements: setFilterPanelFormElements,
    }),
    [filterPanelFormElements]
  );

  const pagination = useMemo(() => {
    return buttonCallsPayload
      ? {
          totalPages: buttonCallsPayload.totalPages,
          totalRows: buttonCallsPayload.totalNumber,
        }
      : null;
  }, [buttonCallsPayload]);

  // Effect to reset current page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements, setCurrentPage]);

  return (
    <>
      <Header showLocationSelector={true} />
      <div className="w-[98%] mx-auto my-10">
        <GenericTable
          rowKeys={rowKeys}
          filters={tableFilters}
          columns={columns}
          filterPanel={filterPanel}
          rows={rows ?? []}
          title={t("Button Calls")}
          actions={actions}
          isActionsActive={isButtonCallEnableEdit}
          isActionsAtFront={isButtonCallEnableEdit}
          outsideSortProps={outsideSort}
          {...(pagination && { pagination })}
        />
      </div>
    </>
  );
}
