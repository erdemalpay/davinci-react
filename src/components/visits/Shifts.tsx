import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaRegStar, FaStar } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { LuCopyPlus } from "react-icons/lu";
import { MultiValue } from "react-select";
import { useFilterContext } from "../../context/Filter.context";
import { useLocationContext } from "../../context/Location.context";
import { useShiftContext } from "../../context/Shift.context";
import { useUserContext } from "../../context/User.context";
import {
  DateRangeKey,
  OptionType,
  RoleEnum,
  commonDateOptions,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetStoreLocations } from "../../utils/api/location";
import {
  useCopyShiftIntervalMutation,
  useCopyShiftMutation,
  useGetShifts,
  useShiftMutations,
} from "../../utils/api/shift";
import { useGetAllUserRoles, useGetUsers } from "../../utils/api/user";
import { convertDateFormat, formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import SelectInput from "../panelComponents/FormElements/SelectInput";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const Shifts = () => {
  const { t } = useTranslation();
  const [tableKey, setTableKey] = useState(0);
  const users = useGetUsers();
  const [isShiftsEditModalOpen, setIsShiftsEditModalOpen] = useState(false);
  const [isCopyShiftModalOpen, setIsCopyShiftModalOpen] = useState(false);
  const [isCopyShiftIntervalModalOpen, setIsCopyShiftIntervalModalOpen] =
    useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const locations = useGetStoreLocations();
  const roles = useGetAllUserRoles();
  const { mutate: copyShift } = useCopyShiftMutation();
  const { mutate: copyShiftInterval } = useCopyShiftIntervalMutation();
  const { selectedLocationId, setSelectedLocationId } = useLocationContext();
  const [copyShiftForm, setCopyShiftForm] = useState({
    copiedDay: "",
    selectedDay: "",
    location: "",
    selectedUsers: [],
  });
  const [copyShiftIntervalForm, setCopyShiftIntervalForm] = useState({
    startCopiedDay: "",
    endCopiedDay: "",
    selectedDay: "",
    location: "",
    selectedUsers: [],
  });
  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
  } = useShiftContext();
  const shifts = useGetShifts(
    filterPanelFormElements?.after,
    filterPanelFormElements?.before,
    selectedLocationId
  );
  const { user } = useUserContext();
  const isDisabledCondition = user
    ? ![
        RoleEnum.MANAGER,
        RoleEnum.GAMEMANAGER,
        RoleEnum.OPERATIONSASISTANT,
      ].includes(user?.role?._id)
    : true;
  const [rowToAction, setRowToAction] = useState<any>();
  const { updateShift, createShift, deleteShift } = useShiftMutations();
  const {
    showShiftsFilters,
    setShowShiftsFilters,
    isShiftsEnableEdit,
    setIsShiftsEnableEdit,
    isChefAssignOpen,
    setIsChefAssignOpen,
  } = useFilterContext();
  const foundLocation = getItem(selectedLocationId, locations);
  const initialFormState: Record<string, any> = {
    day: "",
    ...(foundLocation?.shifts?.reduce<Record<string, string[]>>(
      (acc, shift) => {
        acc[shift.shift] = [];
        return acc;
      },
      {}
    ) || {}),
  };
  const [form, setForm] = useState(initialFormState);
  const unfilteredShiftRows = shifts?.map((shift) => {
    const shiftMapping = shift?.shifts?.reduce((acc, shiftValue) => {
      if (shiftValue.shift && shiftValue.user) {
        acc[shiftValue.shift] = shiftValue.user?.filter((userId) => {
          const foundUser = getItem(userId, users);
          return foundUser;
        });
      }
      return acc;
    }, {} as { [key: string]: string[] });
    const dayName = new Date(shift.day).toLocaleDateString("en-US", {
      weekday: "long",
    });
    return {
      ...shift,
      formattedDay:
        convertDateFormat(shift.day) + "  " + "(" + t(dayName) + ")",
      ...shiftMapping,
    };
  });
  const allRows = shifts?.map((shift) => {
    const shiftMapping = shift?.shifts?.reduce((acc, shiftValue) => {
      if (shiftValue.shift && shiftValue.user) {
        acc[shiftValue.shift] = shiftValue.user?.filter((userId) => {
          const foundUser = getItem(userId, users);
          return (
            foundUser &&
            (filterPanelFormElements?.role?.length === 0 ||
              filterPanelFormElements?.role?.includes(foundUser?.role?._id))
          );
        });
      }
      return acc;
    }, {} as { [key: string]: string[] });
    const dayName = new Date(shift.day).toLocaleDateString("en-US", {
      weekday: "long",
    });
    return {
      ...shift,
      formattedDay:
        convertDateFormat(shift.day) + "  " + "(" + t(dayName) + ")",
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
    {
      type: InputTypes.SELECT,
      formKey: "selectedUsers",
      label: t("Selected Users"),
      options: users
        ?.filter((user) => {
          if (filterPanelFormElements?.role?.length > 0) {
            return filterPanelFormElements?.role?.includes(user?.role?._id);
          }
          return true;
        })
        ?.filter((user) => {
          if (copyShiftForm?.copiedDay) {
            return shifts
              ?.filter((shift) => shift.day === copyShiftForm?.copiedDay)
              ?.map((shift) => shift?.shifts)
              ?.flat()
              ?.some((shift) => shift?.user?.includes(user._id));
          }
        })
        ?.map((user) => ({
          value: user._id,
          label: user.name,
        })),
      placeholder: t("Selected Users"),
      isMultiple: true,
      required: false,
    },
  ];
  const copyShiftFormKeys = [
    { key: "copiedDay", type: FormKeyTypeEnum.STRING },
    { key: "selectedDay", type: FormKeyTypeEnum.STRING },
    { key: "selectedUsers", type: FormKeyTypeEnum.STRING },
    { key: "location", type: FormKeyTypeEnum.NUMBER },
  ];
  const copyShifIntervaltInputs = [
    {
      type: InputTypes.DATE,
      formKey: "startCopiedDay",
      label: t("Start Date"),
      placeholder: t("Start Date"),
      required: true,
      isDatePicker: true,
      isOnClearActive: false,
    },
    {
      type: InputTypes.DATE,
      formKey: "endCopiedDay",
      label: t("End Date"),
      placeholder: t("End Date"),
      required: true,
      isDatePicker: true,
      isOnClearActive: false,
    },
    {
      type: InputTypes.DATE,
      formKey: "selectedDay",
      label: t("Selected Date"),
      placeholder: t("Selected Date"),
      required: true,
      isDatePicker: true,
      isOnClearActive: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "selectedUsers",
      label: t("Selected Users"),
      options: users
        ?.filter((user) => {
          if (
            copyShiftIntervalForm?.startCopiedDay &&
            copyShiftIntervalForm?.endCopiedDay
          ) {
            return shifts
              ?.filter((shift) => {
                const startDate = new Date(
                  copyShiftIntervalForm?.startCopiedDay
                );
                const endDate = new Date(copyShiftIntervalForm?.endCopiedDay);
                const shiftDate = new Date(shift.day);
                return shiftDate >= startDate && shiftDate <= endDate;
              })
              ?.map((shift) => shift?.shifts)
              ?.flat()
              ?.some((shift) => shift?.user?.includes(user._id));
          }
        })
        ?.map((user) => ({
          value: user._id,
          label: user.name,
        })),
      placeholder: t("Selected Users"),
      isMultiple: true,
      required: false,
    },
  ];
  const copyShiftIntervalFormKeys = [
    { key: "startCopiedDay", type: FormKeyTypeEnum.STRING },
    { key: "endCopiedDay", type: FormKeyTypeEnum.STRING },
    { key: "selectedDay", type: FormKeyTypeEnum.STRING },
    { key: "selectedUsers", type: FormKeyTypeEnum.STRING },
    { key: "location", type: FormKeyTypeEnum.NUMBER },
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
      const locationShift = shift.shift;
      columns.push({
        key: `${locationShift}${
          shift.shiftEndHour ? ` - ${shift.shiftEndHour}` : ""
        }`,
        isSortable: false,
        correspondingKey: shift.shift,
      });
      if (
        isDisabledCondition ||
        (!isShiftsEnableEdit && !isDisabledCondition)
      ) {
        rowKeys.push({
          key: locationShift,
          node: (row: any) => {
            const shiftValue = row[shift.shift];
            const currentShifts = shifts
              ?.find((shift) => shift.day === row.day)
              ?.shifts?.filter((s) => s.shift === shift.shift);
            const foundChefUser = currentShifts?.find(
              (shift) => shift?.chefUser
            )?.chefUser;
            if (Array.isArray(shiftValue)) {
              return (
                <div className="flex flex-row gap-1 flex-wrap max-w-40">
                  {shiftValue?.map((user: string, index: number) => {
                    const foundUser = getItem(user, users);
                    return (
                      <p
                        key={`${row.day}${foundUser?._id}${index}`}
                        className={` flex flex-row items-center gap-1 ${
                          filterPanelFormElements.user === foundUser?._id
                            ? "bg-red-400 text-white px-4 py-1 rounded-md w-fit  "
                            : ""
                        } ${
                          foundChefUser === foundUser?._id
                            ? "border px-2 border-yellow-500 rounded-md"
                            : ""
                        }`}
                      >
                        {foundUser?.name}

                        <span
                          className="text-yellow-800 cursor-pointer"
                          onClick={() => {
                            if (!isChefAssignOpen) return;
                            const currentShifts = shifts
                              ?.find((s) => s.day === row.day)
                              ?.shifts?.map((shiftObj) => {
                                return {
                                  ...shiftObj,
                                  chefUser:
                                    shiftObj.shift === shift.shift
                                      ? shiftObj?.chefUser === foundUser?._id
                                        ? ""
                                        : foundUser?._id
                                      : shiftObj.chefUser,
                                };
                              });

                            if (row?._id) {
                              updateShift({
                                id: row._id,
                                updates: {
                                  shifts: currentShifts,
                                },
                              });
                            }
                          }}
                        >
                          {foundChefUser === foundUser?._id ? (
                            <FaStar />
                          ) : isChefAssignOpen ? (
                            <FaRegStar />
                          ) : null}
                        </span>
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
        rowKeys.push({
          key: locationShift,
          node: (row: any) => {
            const shiftValue = row[shift.shift];
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
                  options={users
                    ?.filter((user) => {
                      if (filterPanelFormElements?.role?.length > 0) {
                        return filterPanelFormElements?.role?.includes(
                          user?.role?._id
                        );
                      }
                      return true;
                    })
                    ?.map((user) => ({
                      value: user._id,
                      label: user.name,
                    }))}
                  isMultiple={true}
                  value={normalizedValue}
                  placeholder=""
                  isOnClearActive={false}
                  onChange={(selectedOption) => {
                    const foundRow: any = unfilteredShiftRows?.find(
                      (r) => r._id === row?._id
                    );
                    const newValue = (
                      selectedOption as MultiValue<OptionType>
                    ).map((o) => o.value);
                    const updatedShifts = foundLocation?.shifts?.map(
                      (foundShift) => {
                        const existing = (
                          (foundRow?.[foundShift.shift] ??
                            row?.[foundShift.shift] ??
                            []) as string[]
                        ).filter((userId) => {
                          if (!filterPanelFormElements?.role?.length)
                            return true;
                          const foundUser = getItem(userId, users);
                          return (
                            foundUser &&
                            !filterPanelFormElements.role.includes(
                              foundUser.role._id
                            )
                          );
                        });
                        const currentSelectedRoleUsers = (
                          (foundRow?.[foundShift.shift] ??
                            row?.[foundShift.shift] ??
                            []) as string[]
                        ).filter((userId) => {
                          if (!filterPanelFormElements?.role?.length)
                            return false;

                          const foundUser = getItem(userId, users);
                          return (
                            foundUser &&
                            filterPanelFormElements.role.includes(
                              foundUser.role._id
                            )
                          );
                        });
                        const user =
                          foundShift?.shift === shift?.shift
                            ? filterPanelFormElements?.role?.length > 0
                              ? Array.from(new Set([...existing, ...newValue]))
                              : newValue
                            : Array.from(
                                new Set([
                                  ...existing,
                                  ...currentSelectedRoleUsers,
                                ])
                              );
                        return {
                          shift: foundShift.shift,
                          ...(foundShift.shiftEndHour && {
                            shiftEndHour: foundShift.shiftEndHour,
                          }),
                          user,
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
      formKey: shift.shift,
      label: shift.shift,
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
      key: shift.shift,
      type: FormKeyTypeEnum.STRING,
    })),
  ];
  if (isShiftsEnableEdit) {
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
          isOpen={isShiftsEditModalOpen}
          close={() => setIsShiftsEditModalOpen(false)}
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
                shift: shift.shift,
                ...(shift.shiftEndHour && { shiftEndHour: shift.shiftEndHour }),
                user: form?.[shift.shift],
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
                shift: shift.shift,
                ...(shift.shiftEndHour && { shiftEndHour: shift.shiftEndHour }),
                user: form?.[shift.shift],
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
      isModalOpen: isShiftsEditModalOpen,
      setIsModal: setIsShiftsEditModalOpen,
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
          setForm={setCopyShiftForm}
          formKeys={copyShiftFormKeys}
          submitItem={copyShift as any}
          isEditMode={false}
          constantValues={{
            selectedDay: rowToAction?.day,
            location: selectedLocationId,
          }}
          topClassName="flex flex-col gap-2  "
        />
      ) : null,
      isModalOpen: isCopyShiftModalOpen,
      setIsModal: setIsCopyShiftModalOpen,
      isPath: false,
      isDisabled: isDisabledCondition,
    },
  ];
  const copyShiftIntervalButton = {
    name: t(`Copy Shift Interval`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isCopyShiftIntervalModalOpen}
        close={() => setIsCopyShiftIntervalModalOpen(false)}
        setForm={setCopyShiftIntervalForm}
        constantValues={{ location: selectedLocationId }}
        inputs={copyShifIntervaltInputs}
        formKeys={copyShiftIntervalFormKeys}
        submitItem={copyShiftInterval as any}
        topClassName="flex flex-col gap-2 "
      />
    ),
    isModalOpen: isCopyShiftIntervalModalOpen,
    setIsModal: setIsCopyShiftIntervalModalOpen,
    isPath: false,
    isDisabled: isDisabledCondition,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
  };
  const filters = [
    ...locations.map((location) => {
      return {
        isUpperSide: true,
        node: (
          <ButtonFilter
            buttonName={location.name}
            onclick={() => {
              setSelectedLocationId(location._id);
            }}
          />
        ),
      };
    }),
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showShiftsFilters}
          onChange={() => {
            setShowShiftsFilters(!showShiftsFilters);
          }}
        />
      ),
    },
    {
      label: t("Chef Assign"),
      isUpperSide: false,
      node: (
        <SwitchButton
          checked={isChefAssignOpen}
          onChange={() => {
            setIsChefAssignOpen(!isChefAssignOpen);
          }}
        />
      ),
      isDisabled: isDisabledCondition,
    },
    {
      label: t("Enable Edit"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={isShiftsEnableEdit}
          onChange={() => {
            setIsShiftsEnableEdit(!isShiftsEnableEdit);
          }}
        />
      ),
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
      additionalOnChange: ({ value }: { value: string; label: string }) => {
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
    {
      type: InputTypes.SELECT,
      formKey: "role",
      label: t("Roles"),
      options: roles?.map((role) => {
        return {
          value: role._id,
          label: role.name,
        };
      }),
      isMultiple: true,
      placeholder: t("Roles"),
      required: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "user",
      label: t("User"),
      options: users
        ?.filter((user) => {
          if (filterPanelFormElements?.role?.length > 0) {
            return filterPanelFormElements?.role?.includes(user?.role?._id);
          }
          return true;
        })
        ?.map((user) => {
          return {
            value: user._id,
            label: user.name,
          };
        }),
      placeholder: t("User"),
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showShiftsFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowShiftsFilters(false),
    additionalFilterCleanFunction: () => {
      setFilterPanelFormElements(initialFilterPanelFormElements);
    },
  };
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [
    shifts,
    users,
    locations,
    selectedLocationId,
    roles,
    filterPanelFormElements,
  ]);
  return (
    <div className="w-[95%] my-5 mx-auto">
      <GenericTable
        key={tableKey}
        rowKeys={rowKeys}
        columns={columns}
        addButton={copyShiftIntervalButton}
        rows={rows}
        isActionsActive={isShiftsEnableEdit}
        actions={isShiftsEnableEdit ? actions : []}
        filters={filters}
        title={
          getItem(selectedLocationId, locations)?.name +
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
          getItem(selectedLocationId, locations)?.name +
          formatAsLocalDate(filterPanelFormElements.after) +
          formatAsLocalDate(filterPanelFormElements.before)
        }.xlsx`}
      />
    </div>
  );
};

export default Shifts;
