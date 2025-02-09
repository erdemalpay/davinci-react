import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useShiftContext } from "../../context/Shift.context";
import { useUserContext } from "../../context/User.context";
import { DateRangeKey, RoleEnum, commonDateOptions } from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetShifts, useShiftMutations } from "../../utils/api/shift";
import { useGetUsers } from "../../utils/api/user";
import { convertDateFormat, formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { LocationInput } from "../../utils/panelInputs";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const Shifts = () => {
  const { t } = useTranslation();
  const [tableKey, setTableKey] = useState(0);
  const users = useGetUsers();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const locations = useGetStoreLocations();
  const shifts = useGetShifts();
  const { user } = useUserContext();
  const isDisabledCondition = user
    ? ![RoleEnum.MANAGER].includes(user?.role?._id)
    : true;
  const [rowToAction, setRowToAction] = useState<any>();
  const { updateShift, createShift, deleteShift } = useShiftMutations();
  const [showFilters, setShowFilters] = useState(false);
  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
  } = useShiftContext();
  const foundLocation = getItem(filterPanelFormElements?.location, locations);
  const initialFormState: Record<string, any> = {
    day: "",
    ...(foundLocation?.shifts?.reduce<Record<string, string[]>>(
      (acc, shift) => {
        acc[shift] = [];
        return acc;
      },
      {}
    ) || {}),
  };
  const [form, setForm] = useState(initialFormState);
  const allRows = shifts?.map((shift) => {
    const shiftMapping = shift.shifts?.reduce((acc, shiftValue) => {
      if (shiftValue.shift && shiftValue.user) {
        acc[shiftValue.shift] = shiftValue.user;
      }
      return acc;
    }, {} as { [key: string]: string[] });
    return {
      ...shift,
      formattedDay: convertDateFormat(shift.day),
      ...shiftMapping,
    };
  });
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Date"), isSortable: true, correspondingKey: "formattedDay" },
  ];
  const rowKeys = [
    {
      key: "day",
      node: (row: any) => <p className="min-w-32 pr-2">{row.formattedDay}</p>,
    },
  ];
  if (foundLocation?.shifts && foundLocation?.shifts?.length > 0) {
    for (const shift of foundLocation.shifts) {
      columns.push({ key: shift, isSortable: false, correspondingKey: shift });
      rowKeys.push({
        key: shift,
        node: (row: any) => {
          const foundUser = getItem(row[shift], users);
          return (
            <p
              className={`${
                filterPanelFormElements.user === foundUser?._id
                  ? "bg-red-400 text-white px-4 py-1 rounded-md w-fit "
                  : ""
              }`}
            >
              {foundUser?.name}
            </p>
          );
        },
      });
    }
  }
  const inputs = [
    {
      type: InputTypes.DATE,
      formKey: "day",
      label: t("Date"),
      placeholder: t("Date"),
      required: !rowToAction?._id,
      isDisabled: true,
    },
    ...(foundLocation?.shifts ?? []).map((shift) => ({
      type: InputTypes.SELECT,
      formKey: shift,
      label: shift,
      options: (users ?? []).map((user) => ({
        value: user._id,
        label: user.name,
      })),
      placeholder: t("User"),
      isMultiple: true,
      required: false,
    })),
  ];
  const formKeys = [
    { key: "day", type: FormKeyTypeEnum.DATE },
    ...(foundLocation?.shifts ?? []).map((shift) => ({
      key: shift,
      type: FormKeyTypeEnum.STRING,
    })),
  ];
  if (!isDisabledCondition) {
    columns.push({ key: t("Actions"), isSortable: false } as any);
  }
  const actions = [
    {
      name: t("Edit"),
      icon: <FiEdit />,
      className: "text-2xl text-blue-500 cursor-pointer",
      isModal: true,
      setRow: setRowToAction,
      modal: (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          constantValues={rowToAction}
          submitItem={updateShift as any}
          isEditMode={true}
          setForm={setForm}
          handleUpdate={() => {
            // handle create
            if (!rowToAction?._id && foundLocation) {
              const shifts = foundLocation?.shifts?.map((shift) => ({
                shift,
                user: form?.[shift],
              }));
              createShift({
                shifts,
                location: foundLocation?._id,
                day: form.day,
              });
            }
            // handle update
            else {
              const shifts = foundLocation?.shifts?.map((shift) => ({
                shift,
                user: form?.[shift],
              }));
              updateShift({
                id: rowToAction?._id,
                updates: {
                  shifts,
                },
              });
            }
          }}
          topClassName="flex flex-col gap-2  "
        />
      ),
      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
      isDisabled: isDisabledCondition,
    },
    {
      name: t("Delete"),
      isDisabled: isDisabledCondition,
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            deleteShift(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title="Delete Shift"
          text={`${rowToAction.formattedDate} shift will be deleted. Are you sure you want to continue?`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl  ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
  ];
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  const filterPanelInputs = [
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
    LocationInput({ locations: locations }),
    {
      type: InputTypes.SELECT,
      formKey: "user",
      label: t("User"),
      options: users?.map((user) => {
        return {
          value: user._id,
          label: user.name,
        };
      }),
      placeholder: t("User"),
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
    additionalFilterCleanFunction: () => {
      setFilterPanelFormElements(initialFilterPanelFormElements);
    },
  };
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [shifts, users, locations]);

  return (
    <div className="w-[95%] my-5 mx-auto">
      <GenericTable
        key={tableKey}
        rowKeys={rowKeys}
        columns={columns}
        rows={rows}
        isActionsActive={!isDisabledCondition}
        actions={actions}
        filters={filters}
        title={
          getItem(filterPanelFormElements.location, locations)?.name +
          "  " +
          formatAsLocalDate(filterPanelFormElements.after) +
          "-" +
          formatAsLocalDate(filterPanelFormElements.before) +
          "  " +
          t("Shifts")
        }
        isExcel={true}
        filterPanel={filterPanel as any}
        excelFileName={`${
          getItem(filterPanelFormElements.location, locations)?.name +
          formatAsLocalDate(filterPanelFormElements.after) +
          formatAsLocalDate(filterPanelFormElements.before)
        }.xlsx`}
      />
    </div>
  );
};

export default Shifts;
