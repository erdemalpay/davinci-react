import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { LuCopyPlus } from "react-icons/lu";
import { useFilterContext } from "../../context/Filter.context";
import { useLocationContext } from "../../context/Location.context";
import { useShiftContext } from "../../context/Shift.context";
import { useUserContext } from "../../context/User.context";
import {
  DateRangeKey,
  RoleEnum,
  commonDateOptions,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetStoreLocations } from "../../utils/api/location";
import {
  useCopyShiftMutation,
  useGetShifts,
  useShiftMutations,
} from "../../utils/api/shift";
import { useGetAllUserRoles, useGetUsers } from "../../utils/api/user";
import { convertDateFormat, formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const ShiftChange = () => {
  const { t } = useTranslation();
  const [tableKey, setTableKey] = useState(0);
  const users = useGetUsers();
  const [isShiftsEditModalOpen, setIsShiftsEditModalOpen] = useState(false);
  const [isCopyShiftModalOpen, setIsCopyShiftModalOpen] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const locations = useGetStoreLocations();
  const buildShiftKey = (
    shiftData: { shift?: string; shiftEndHour?: string } | null | undefined,
    locationId?: number | null
  ) => {
    const shiftStart = shiftData?.shift?.trim() || "";
    let shiftEnd = shiftData?.shiftEndHour?.trim();

    if (!shiftEnd && locationId !== undefined && locationId !== null) {
      const location = getItem(locationId, locations);
      const matchedShift = location?.shifts?.find(
        (locationShift) => locationShift.shift?.trim() === shiftStart
      );
      shiftEnd = matchedShift?.shiftEndHour?.trim();
    }

    return `${shiftStart}-${shiftEnd || ""}`;
  };
  const roles = useGetAllUserRoles();
  const { mutate: copyShift } = useCopyShiftMutation();
  const { selectedLocationId, setSelectedLocationId } = useLocationContext();
  const [copyShiftForm, setCopyShiftForm] = useState({
    copiedDay: "",
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
  } = useFilterContext();
  const foundLocation = getItem(selectedLocationId, locations);

  // Get all unique shifts from all locations, sorted by start time (for "All" mode)
  const allShifts =
    selectedLocationId === -1
      ? (() => {
        const shiftsMap = new Map<
          string,
          { shift: string; shiftEndHour?: string }
        >();

        locations.forEach((location) => {
          location.shifts?.forEach((shift) => {
            const key = buildShiftKey(shift);
            if (!shiftsMap.has(key)) {
              shiftsMap.set(key, {
                shift: shift.shift,
                shiftEndHour: shift.shiftEndHour,
              });
            }
          });
        });

        const shiftsArray = Array.from(shiftsMap.values());

        // Sort by shift start time
        return shiftsArray.sort((a, b) => {
          const [aHour, aMin] = a.shift.split(":").map(Number);
          const [bHour, bMin] = b.shift.split(":").map(Number);
          return aHour * 60 + aMin - (bHour * 60 + bMin);
        });
      })()
      : foundLocation?.shifts || [];

  const initialFormState: Record<string, any> = {
    day: "",
    ...(allShifts?.reduce<Record<string, string[]>>((acc, shift) => {
      acc[shift.shift] = [];
      return acc;
    }, {}) || {}),
  };
  const [form, setForm] = useState(initialFormState);
  const allRows =
    selectedLocationId === -1
      ? (() => {
        // Group by day for "All" mode
        const groupedByDay = shifts?.reduce((acc, shift) => {
          if (!acc[shift.day]) {
            acc[shift.day] = [];
          }
          acc[shift.day].push(shift);
          return acc;
        }, {} as Record<string, any[]>);

        return Object.entries(groupedByDay || {}).map(([day, dayShifts]) => {
          const shiftsByLocation: Record<
            string,
            Array<{
              location: number;
              users: string[];
              chefUser?: string;
              _id: string;
            }>
          > = {};

          dayShifts.forEach((shiftRecord) => {
            shiftRecord.shifts?.forEach((s: any) => {
              const shiftKey = buildShiftKey(s, shiftRecord.location);
              if (!shiftsByLocation[shiftKey]) {
                shiftsByLocation[shiftKey] = [];
              }

              const locationConfig = getItem(shiftRecord.location, locations);
              // Skip shifts not defined for this location to avoid rendering phantom dropdowns
              const locationHasShift = locationConfig?.shifts?.some(
                (locationShift) => {
                  return (
                    buildShiftKey(locationShift, shiftRecord.location) ===
                    shiftKey
                  );
                }
              );
              if (!locationHasShift) {
                return;
              }

              // Check if this location already exists for this shift
              const existingIndex = shiftsByLocation[shiftKey].findIndex(
                (sl) => sl.location === shiftRecord.location
              );

              if (existingIndex === -1) {
                shiftsByLocation[shiftKey].push({
                  location: shiftRecord.location,
                  users:
                    s.user?.filter((userId: string) => {
                      const foundUser = getItem(userId, users);
                      return (
                        foundUser &&
                        (!filterPanelFormElements?.role ||
                          filterPanelFormElements?.role?.length === 0 ||
                          filterPanelFormElements?.role?.includes(
                            foundUser?.role?._id
                          ))
                      );
                    }) || [],
                  chefUser: s.chefUser,
                  _id: shiftRecord._id,
                });
              }
            });
          });

          const dayName = new Date(day).toLocaleDateString("en-US", {
            weekday: "long",
          });
          return {
            day,
            formattedDay:
              convertDateFormat(day) + "  " + "(" + t(dayName) + ")",
            shiftsByLocation,
          };
        });
      })()
      : shifts?.map((shift) => {
        const shiftMapping = shift?.shifts?.reduce((acc, shiftValue) => {
          if (shiftValue.shift && shiftValue.user) {
            acc[shiftValue.shift] = shiftValue.user?.filter((userId) => {
              const foundUser = getItem(userId, users);
              return (
                foundUser &&
                (!filterPanelFormElements?.role ||
                  filterPanelFormElements?.role?.length === 0 ||
                  filterPanelFormElements?.role?.includes(
                    foundUser?.role?._id
                  ))
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
  if (allShifts && allShifts?.length > 0) {
    for (const shift of allShifts) {
      const locationShift = shift.shift;
      const shiftKey = buildShiftKey(shift);
      columns.push({
        key: `${locationShift}${
          shift.shiftEndHour ? ` - ${shift.shiftEndHour}` : ""
        }`,
        isSortable: false,
        correspondingKey: shift.shift,
      });
      rowKeys.push({
          key: shiftKey,
          node: (row: any) => {
            // Check if we're in "All" mode
            if (selectedLocationId === -1) {
              const shiftKey = buildShiftKey(shift);
              const shiftLocations = row.shiftsByLocation?.[shiftKey] || [];

              if (shiftLocations.length === 0) return <></>;

              return (
                <div className="flex flex-col gap-2 mx-3 ">
                  {shiftLocations.map((shiftLocation: any, idx: number) => {
                    const location = getItem(shiftLocation.location, locations);

                    if (
                      !shiftLocation.users ||
                      shiftLocation.users.length === 0
                    )
                      return null;

                    return (
                      <div key={idx} className="flex flex-col  gap-1 ">
                        <div
                          className="font-semibold text-sm"
                          style={{
                            color: location?.backgroundColor || "#6B7280",
                          }}
                        >
                          {location?.name}
                        </div>
                        <div className="flex flex-row flex-wrap gap-0.5  max-w-[50rem] w-full ">
                          {shiftLocation.users?.map(
                            (userId: string, userIdx: number) => {
                              const foundUser = getItem(userId, users);
                              return (
                                <div
                                  key={userIdx}
                                  className={`flex flex-row flex-wrap gap-1 p-2 rounded-lg text-white border-white ${
                                    filterPanelFormElements.user ===
                                    foundUser?._id
                                      ? "font-bold underline"
                                      : ""
                                  }`}
                                  style={{
                                    backgroundColor: foundUser?.role?.color,
                                  }}
                                >
                                  {foundUser?.name}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            } else {
              // Original single location logic
              const shiftValue = row[shift.shift];
              if (Array.isArray(shiftValue) && shiftValue.length > 0) {
                return (
                  <div
                    className={`flex flex-row gap-1 flex-wrap  rounded-md text-white  max-w-60 mx-3`}
                  >
                    {shiftValue?.map((user: string, index: number) => {
                      const foundUser = getItem(user, users);
                      return (
                        <div
                          key={`${row.day}${foundUser?._id}${index}`}
                          className={`flex flex-row items-center gap-1 p-2 rounded-lg text-white border border-white ${
                            filterPanelFormElements.user === foundUser?._id
                              ? "font-bold underline"
                              : ""
                          }`}
                          style={{ backgroundColor: foundUser?.role?.color }}
                        >
                          {foundUser?.name}
                        </div>
                      );
                    })}
                  </div>
                );
              }
              // else if (shiftValue) {
              //   const foundUser = getItem(shiftValue, users);
              //   return (
              //     <div className="flex justify-center items-center">
              //       <div
              //         className="px-2 py-1 rounded-md w-fit text-white"
              //         style={{
              //           backgroundColor:
              //             foundLocation?.backgroundColor || "#6B7280",
              //         }}
              //       >
              //         <div
              //           key={`${row.day}${foundUser?._id}-single`}
              //           className={`px-2 py-1 rounded-md text-white border border-white ${
              //             filterPanelFormElements.user === foundUser?._id
              //               ? "font-bold underline"
              //               : ""
              //           }`}
              //           style={{ backgroundColor: foundUser?.role?.color }}
              //         >
              //           {foundUser?.name}
              //         </div>
              //       </div>
              //     </div>
              //   );
              // }
              return <></>;
            }
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
    ...(allShifts ?? []).map((shift) => ({
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
    ...(allShifts ?? []).map((shift) => ({
      key: shift.shift,
      type: FormKeyTypeEnum.STRING,
    })),
  ];

  const filters = [
    {
      isUpperSide: true,
      node: (
        <ButtonFilter
          buttonName={t("All")}
          onclick={() => {
            setSelectedLocationId(-1);
          }}
          backgroundColor="#6B7280"
          isActive={selectedLocationId === -1}
        />
      ),
    },
    ...locations.map((location) => {
      return {
        isUpperSide: true,
        node: (
          <ButtonFilter
            buttonName={location.name}
            onclick={() => {
              setSelectedLocationId(location._id);
            }}
            backgroundColor={location.backgroundColor}
            isActive={selectedLocationId === location._id}
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
    isApplyButtonActive: true,
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
        rows={rows}
        isActionsActive={!isDisabledCondition}
        filters={filters}
        title={
          (getItem(selectedLocationId, locations)?.name || t("All")) +
          "  " +
          formatAsLocalDate(filterPanelFormElements.after) +
          "-" +
          formatAsLocalDate(filterPanelFormElements.before) +
          "  " +
          t("Shifts")
        }
        filterPanel={filterPanel as any}
      />
    </div>
  );
};

export default ShiftChange;
