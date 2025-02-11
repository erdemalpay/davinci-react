import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { LuCopyPlus } from "react-icons/lu";
import { MultiValue } from "react-select";
import { useShiftContext } from "../../context/Shift.context";
import { useUserContext } from "../../context/User.context";
import { DateRangeKey, RoleEnum, commonDateOptions } from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetStoreLocations } from "../../utils/api/location";
import {
  useCopyShiftMutation,
  useGetShifts,
  useShiftMutations,
} from "../../utils/api/shift";
import { useGetUsers } from "../../utils/api/user";
import { convertDateFormat, formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { LocationInput } from "../../utils/panelInputs";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import SelectInput from "../panelComponents/FormElements/SelectInput";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type OptionType = { value: any; label: string };

const Shifts = () => {
  const { t } = useTranslation();
  const [tableKey, setTableKey] = useState(0);
  const users = useGetUsers();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCopyShiftModalOpen, setIsCopyShiftModalOpen] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const locations = useGetStoreLocations();
  const shifts = useGetShifts();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const { mutate: copyShift } = useCopyShiftMutation();
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
    const shiftMapping = shift?.shifts?.reduce((acc, shiftValue) => {
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
  const copyShiftInputs = [
    {
      type: InputTypes.DATE,
      formKey: "copiedDay",
      label: t("Copied Day"),
      placeholder: t("Copied Day"),
      required: true,
      isDatePicker: true,
      isOnClearActive: false,
    },
    {
      type: InputTypes.DATE,
      formKey: "selectedDay",
      label: t("Selected Day"),
      placeholder: t("Selected Day"),
      required: true,
      isDatePicker: true,
      isOnClearActive: false,
      isDisabled: true,
    },
  ];
  const copyShiftFormKeys = [
    { key: "copiedDay", type: FormKeyTypeEnum.STRING },
    { key: "selectedDay", type: FormKeyTypeEnum.STRING },
  ];
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
      if (isDisabledCondition || (!isEnableEdit && !isDisabledCondition)) {
        // When disabled, simply render the text (first node)
        rowKeys.push({
          key: shift,
          node: (row: any) => {
            const shiftValue = row[shift];
            if (Array.isArray(shiftValue)) {
              return (
                <div className="flex flex-row gap-1 flex-wrap max-w-40">
                  {shiftValue.map((user: string, index: number) => {
                    const foundUser = getItem(user, users);
                    return (
                      <p
                        key={`${row.day}${foundUser?._id}${index}`}
                        className={
                          filterPanelFormElements.user === foundUser?._id
                            ? "bg-red-400 text-white px-4 py-1 rounded-md w-fit"
                            : ""
                        }
                      >
                        {foundUser?.name}
                      </p>
                    );
                  })}
                </div>
              );
            } else if (shiftValue) {
              const foundUser = getItem(shiftValue, users);
              return (
                <p
                  key={`${row.day}${foundUser?._id}-single`}
                  className={
                    filterPanelFormElements.user === foundUser?._id
                      ? "bg-red-400 text-white px-4 py-1 rounded-md w-fit"
                      : ""
                  }
                >
                  {foundUser?.name}
                </p>
              );
            }
            return <></>;
          },
        });
      } else {
        // When not disabled, render the SelectInput (second node)
        rowKeys.push({
          key: shift,
          node: (row: any) => {
            const shiftValue = row[shift];
            const normalizedValue = Array.isArray(shiftValue)
              ? shiftValue.map((userId: string) => ({
                  value: userId,
                  label: getItem(userId, users)?.name ?? "",
                }))
              : shiftValue
              ? {
                  value: shiftValue,
                  label: getItem(shiftValue, users)?.name ?? "",
                }
              : null;

            return (
              <div key={`${row.day}${shiftValue}`} className="overflow-visible">
                <SelectInput
                  options={users?.map((user) => ({
                    value: user._id,
                    label: user.name,
                  }))}
                  isMultiple={true}
                  value={normalizedValue}
                  placeholder=""
                  isOnClearActive={false}
                  onChange={(selectedOption) => {
                    const newValue = (
                      selectedOption as MultiValue<OptionType>
                    ).map((option) => option.value);
                    const updatedShifts = foundLocation?.shifts?.map(
                      (foundShift) => {
                        return {
                          shift: foundShift,
                          user:
                            foundShift !== shift ? row[foundShift] : newValue,
                        };
                      }
                    );
                    if (!row?._id && foundLocation) {
                      createShift({
                        shifts: updatedShifts,
                        location: foundLocation._id,
                        day: row.day,
                      });
                    } else {
                      updateShift({
                        id: row?._id,
                        updates: {
                          shifts: updatedShifts,
                        },
                      });
                    }
                  }}
                />
              </div>
            );
          },
        });
      }
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
  if (isEnableEdit) {
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
          text={`Shift will be deleted. Are you sure you want to continue?`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl  ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
    {
      name: t("Copy Shift"),
      icon: <LuCopyPlus />,
      className: "text-2xl mt-1 cursor-pointer",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isCopyShiftModalOpen}
          close={() => setIsCopyShiftModalOpen(false)}
          inputs={copyShiftInputs}
          formKeys={copyShiftFormKeys}
          submitItem={copyShift as any}
          isEditMode={false}
          constantValues={{ selectedDay: rowToAction?.day }}
          topClassName="flex flex-col gap-2  "
        />
      ) : null,
      isModalOpen: isCopyShiftModalOpen,
      setIsModal: setIsCopyShiftModalOpen,
      isPath: false,
      isDisabled: isDisabledCondition,
    },
  ];
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
    {
      label: t("Enable Edit"),
      isUpperSide: true,
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
      isDisabled: isDisabledCondition,
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
        isActionsActive={isEnableEdit}
        actions={isEnableEdit ? actions : []}
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
