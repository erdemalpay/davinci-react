import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { useGetShifts } from "../../utils/api/shift";
import { useCreateShiftChangeRequest } from "../../utils/api/shiftChangeRequest";
import { useGetAllUserRoles, useGetUsers } from "../../utils/api/user";
import { convertDateFormat, formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import { toast } from "react-toastify";

type ShiftChangeFormState = {
  type: "SWAP" | "TRANSFER";
  sourceLocation?: number | "" | null;
  sourceShift?: string;
  targetLocation?: number | "" | null;
  targetShift?: string;
  targetUser?: string;
  requesterNote?: string;
};

const ShiftChange = () => {
  const { t } = useTranslation();
  const users = useGetUsers();

  // Shift Change Request States
  const [isShiftChangeModalOpen, setIsShiftChangeModalOpen] = useState(false);
  const [shiftChangeForm, setShiftChangeForm] = useState<ShiftChangeFormState>({
    type: "SWAP",
  });
  const [conflictWarning, setConflictWarning] = useState<string>("");
  const [modalKey, setModalKey] = useState(0); // Force re-render of modal
  const { mutate: createShiftChangeRequest } = useCreateShiftChangeRequest();
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
  const { selectedLocationId, setSelectedLocationId } = useLocationContext();
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
              return <></>;
            }
          },
        });
    }
  }
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

  // Shift Change Request Button
  const shiftChangeButton = {
    name: t("Change Working Hours"),
    isModal: true,
    modal: null, // Modal'ı aşağıda tanımlayacağız
    isModalOpen: isShiftChangeModalOpen,
    setIsModal: setIsShiftChangeModalOpen,
    isPath: false,
    icon: null,
    className:
      "relative bg-green-500 text-white hover:z-30 focus:z-30 hover:scale-105 focus:scale-105 hover:!bg-green-500 hover:!text-white focus:!bg-green-500 focus:!text-white",
  };
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

  // Get user's own shifts (all shifts where user is assigned)
  const userOwnShifts = shifts?.filter((shift) => {
    // Check if this shift record has the user assigned
    const hasUser = shift.shifts?.some((s: any) => {
      if (Array.isArray(s.user)) {
        return s.user.includes(user?._id);
      }
      return s.user === user?._id;
    });
    return hasUser;
  });

  // Show ALL locations (not just where user has shifts in current date range)
  const userLocations = locations
    ?.map((location) => ({
      value: location._id,
      label: location.name || "",
    }))
    .filter((loc) => loc.label) || [];

  // Get user's shifts for selected source location (only today and future)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const userShiftsInLocation = userOwnShifts
    ?.filter((shift) => {
      if (!shift.location || shift.location !== shiftChangeForm.sourceLocation || !shift.day) {
        return false;
      }
      const shiftDate = new Date(shift.day);
      shiftDate.setHours(0, 0, 0, 0);
      return shiftDate >= today;
    })
    ?.map((shift) => ({
      _id: shift._id,
      day: shift.day,
      shifts: shift.shifts?.filter((s: any) => {
        if (Array.isArray(s.user)) {
          return s.user.includes(user?._id);
        }
        return s.user === user?._id;
      }),
    }));

  // Flatten to get all shift options for user
  const userShiftOptions = userShiftsInLocation
    ?.flatMap((shiftRecord) =>
      shiftRecord.shifts?.map((s: any) => ({
        value: `${shiftRecord._id}|${s.shift}|${s.shiftEndHour || ""}|${shiftRecord.day}`,
        label: `${convertDateFormat(shiftRecord.day)}   /   ${s.shift}${s.shiftEndHour ? `-${s.shiftEndHour}` : ""}`,
        shiftData: {
          shiftId: shiftRecord._id,
          day: shiftRecord.day,
          startTime: s.shift,
          endTime: s.shiftEndHour,
          location: shiftChangeForm.sourceLocation,
          chefUser: s.chefUser,
        },
      }))
    )
    .filter(Boolean);

  // Get all shifts for target location (for SWAP) - only today and future
  const targetLocationShifts = shifts?.filter((shift) => {
    if (!shift.location || shift.location !== shiftChangeForm.targetLocation || !shift.day) {
      return false;
    }
    const shiftDate = new Date(shift.day);
    shiftDate.setHours(0, 0, 0, 0);
    return shiftDate >= today;
  });

  // Get target shift options - filtered by selected target user
  const targetShiftOptions = shiftChangeForm.targetUser
    ? targetLocationShifts
        ?.flatMap((shiftRecord) =>
          shiftRecord.shifts
            ?.filter((s: any) => s.user && s.user.includes(shiftChangeForm.targetUser))
            ?.map((s: any) => ({
              value: `${shiftRecord._id}|${s.shift}|${s.shiftEndHour || ""}|${shiftRecord.day}|${s.user.join(",")}`,
              label: `${convertDateFormat(shiftRecord.day)} / ${s.shift}${s.shiftEndHour ? ` - ${s.shiftEndHour}` : ""}`,
              shiftData: {
                shiftId: shiftRecord._id,
                day: shiftRecord.day,
                startTime: s.shift,
                endTime: s.shiftEndHour,
                location: shiftChangeForm.targetLocation,
                chefUser: s.chefUser,
                users: s.user,
              },
            }))
        )
        .filter(Boolean)
    : [];

  // Shift Change Request Modal Inputs (Dynamic based on type)
  const baseInputs = [
    // Type Selection (First field)
    {
      type: InputTypes.SELECT,
      formKey: "type",
      label: t("Request Type"),
      options: [
        { value: "SWAP", label: t("Swap Shifts (Exchange)") },
        { value: "TRANSFER", label: t("Transfer Shift (Give Away)") },
      ],
      required: true,
      invalidateKeys: [],
      onChangeTrigger: (selectedOption: any) => {
        const selectedValue = Array.isArray(selectedOption)
          ? undefined
          : selectedOption?.value;
        if (!selectedValue) return;
        // Reset form when type changes
        setShiftChangeForm({ type: selectedValue as "SWAP" | "TRANSFER" });
        setModalKey((prev) => prev + 1); // Force modal re-render
      },
    },
    // Source Location
    {
      type: InputTypes.SELECT,
      formKey: "sourceLocation",
      label: t("Your Location"),
      options: userLocations,
      required: true,
      invalidateKeys: [
        { key: "sourceShift", defaultValue: "" },
        { key: "targetLocation", defaultValue: "" },
        { key: "targetShift", defaultValue: "" },
        { key: "targetUser", defaultValue: "" },
      ],
    },
    // Source Shift
    {
      type: InputTypes.SELECT,
      formKey: "sourceShift",
      label: t("Your Shift"),
      options: userShiftOptions || [],
      required: true,
      isDisabled: !shiftChangeForm.sourceLocation,
      invalidateKeys: [{ key: "targetShift", defaultValue: "" }],
    },
  ];

  // SWAP-specific fields (better order: location -> user -> shift)
  const swapFields = shiftChangeForm.type === "SWAP" ? [
    {
      type: InputTypes.SELECT,
      formKey: "targetLocation",
      label: t("Target Location"),
      options: locations?.map((loc) => ({ value: loc._id, label: loc.name })) || [],
      required: true,
      invalidateKeys: [{ key: "targetUser", defaultValue: "" }, { key: "targetShift", defaultValue: "" }],
    },
    {
      type: InputTypes.SELECT,
      formKey: "targetUser",
      label: t("Target User"),
      options: users
        ?.filter((u) => u._id !== user?._id)
        ?.map((u) => ({ value: u._id, label: u.name })) || [],
      required: true,
      isDisabled: !shiftChangeForm.targetLocation,
      invalidateKeys: [{ key: "targetShift", defaultValue: "" }],
    },
    {
      type: InputTypes.SELECT,
      formKey: "targetShift",
      label: t("Target Shift"),
      options: targetShiftOptions || [],
      required: true,
      isDisabled: !shiftChangeForm.targetUser,
      invalidateKeys: [],
    },
  ] : [];

  // TRANSFER-specific fields
  const transferFields = shiftChangeForm.type === "TRANSFER" ? [
    {
      type: InputTypes.SELECT,
      formKey: "targetUser",
      label: t("Transfer To User"),
      options: users
        ?.filter((u) => u._id !== user?._id)
        ?.map((u) => ({ value: u._id, label: u.name })) || [],
      required: true,
      invalidateKeys: [],
    },
  ] : [];

  // Note field (common for both)
  const noteField = {
    type: InputTypes.TEXTAREA,
    formKey: "requesterNote",
    label: t("Reason"),
    required: true,
    invalidateKeys: [],
  } as any;

  // Combine all inputs
  const shiftChangeInputs = [
    ...baseInputs,
    ...swapFields,
    ...transferFields,
    noteField,
  ];

  const shiftChangeFormKeys = [
    { key: "type", type: FormKeyTypeEnum.STRING },
    { key: "sourceLocation", type: FormKeyTypeEnum.NUMBER },
    { key: "sourceShift", type: FormKeyTypeEnum.STRING },
    { key: "targetUser", type: FormKeyTypeEnum.STRING },
    { key: "targetLocation", type: FormKeyTypeEnum.NUMBER },
    { key: "targetShift", type: FormKeyTypeEnum.STRING },
    { key: "requesterNote", type: FormKeyTypeEnum.STRING },
  ];

  // Shift Change Submit Handler
  const handleShiftChangeSubmit = (formData: any) => {
    // Check for conflicts before submitting
    if (conflictWarning) {
      toast.error(t("Cannot submit: User has a conflicting shift"));
      return;
    }

    // Parse source shift
    const [sourceShiftId, sourceStartTime, sourceEndTime, sourceDay] =
      formData.sourceShift.split("|");

    if (formData.type === "SWAP") {
      // Parse target shift
      const [targetShiftId, targetStartTime, targetEndTime, targetDay, targetUsers] =
        formData.targetShift.split("|");

      // Get first user from target shift (or use targetUser if single selection)
      const targetUserId = formData.targetUser || targetUsers.split(",")[0];

      const payload = {
        targetUserId,
        requesterShift: {
          shiftId: Number(sourceShiftId),
          day: sourceDay,
          startTime: sourceStartTime,
          endTime: sourceEndTime || undefined,
          location: formData.sourceLocation,
          userId: user?._id || "",
        },
        targetShift: {
          shiftId: Number(targetShiftId),
          day: targetDay,
          startTime: targetStartTime,
          endTime: targetEndTime || undefined,
          location: formData.targetLocation,
          userId: targetUserId,
        },
        type: "SWAP" as "SWAP" | "TRANSFER",
        requesterNote: formData.requesterNote,
      };

      createShiftChangeRequest(payload, {
        onSuccess: () => {
          setIsShiftChangeModalOpen(false);
          setShiftChangeForm({ type: "SWAP" });
          setConflictWarning("");
          setModalKey((prev) => prev + 1);
        },
      });
    } else if (formData.type === "TRANSFER") {
      const payload = {
        targetUserId: formData.targetUser,
        requesterShift: {
          shiftId: Number(sourceShiftId),
          day: sourceDay,
          startTime: sourceStartTime,
          endTime: sourceEndTime || undefined,
          location: formData.sourceLocation,
          userId: user?._id || "",
        },
        targetShift: {
          shiftId: Number(sourceShiftId), // Same shift for transfer
          day: sourceDay,
          startTime: sourceStartTime,
          endTime: sourceEndTime || undefined,
          location: formData.sourceLocation,
          userId: formData.targetUser,
        },
        type: "TRANSFER" as "SWAP" | "TRANSFER",
        requesterNote: formData.requesterNote,
      };

      createShiftChangeRequest(payload, {
        onSuccess: () => {
          setIsShiftChangeModalOpen(false);
          setShiftChangeForm({ type: "SWAP" });
          setConflictWarning("");
          setModalKey((prev) => prev + 1);
        },
      });
    }
  };

  useEffect(() => {
    setRows(allRows);
  }, [
    shifts,
    users,
    locations,
    selectedLocationId,
    roles,
    filterPanelFormElements,
  ]);

  // Conflict detection for TRANSFER
  useEffect(() => {
    if (
      shiftChangeForm.type === "TRANSFER" &&
      shiftChangeForm.sourceShift &&
      shiftChangeForm.targetUser
    ) {
      // Parse source shift data
      const [, sourceStartTime, , sourceDay] =
        shiftChangeForm.sourceShift.split("|");

      // Find all shifts for target user on the same day
      const targetUserShifts = shifts?.filter(
        (shift) =>
          shift.day === sourceDay &&
          shift.shifts?.some((s: any) => s.user?.includes(shiftChangeForm.targetUser))
      );

      // Check for time conflicts
      const hasConflict = targetUserShifts?.some((shiftRecord) =>
        shiftRecord.shifts?.some((s: any) => {
          if (!s.user?.includes(shiftChangeForm.targetUser)) return false;

          // Check if shift times overlap
          const existingStart = s.shift;
          // Simple overlap check: if times match exactly
          if (existingStart === sourceStartTime) {
            return true;
          }

          // You could add more sophisticated time overlap logic here
          return false;
        })
      );

      if (hasConflict) {
        const targetUserName = getItem(shiftChangeForm.targetUser, users)?.name;
        setConflictWarning(
          t("Warning: {{userName}} already has a shift at this time on {{date}}", {
            userName: targetUserName,
            date: convertDateFormat(sourceDay),
          })
        );
      } else {
        setConflictWarning("");
      }
    } else {
      setConflictWarning("");
    }
  }, [
    shiftChangeForm.type,
    shiftChangeForm.sourceShift,
    shiftChangeForm.targetUser,
    shifts,
    users,
    t,
  ]);
  return (
    <div className="w-[95%] my-5 mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        columns={columns}
        addButton={shiftChangeButton}
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

      {/* Shift Change Request Modal */}
      <GenericAddEditPanel
        key={modalKey}
        isOpen={isShiftChangeModalOpen}
        close={() => {
          setIsShiftChangeModalOpen(false);
          setShiftChangeForm({ type: "SWAP" });
          setConflictWarning("");
          setModalKey((prev) => prev + 1);
        }}
        inputs={shiftChangeInputs}
        formKeys={shiftChangeFormKeys}
        submitItem={handleShiftChangeSubmit}
        buttonName={t("Send Request")}
        topClassName="flex flex-col gap-4"
        isSubmitButtonActive={!conflictWarning}
        constantValues={shiftChangeForm}
        setForm={setShiftChangeForm}
        upperMessage={
          conflictWarning ? [t("Conflict Detected!"), conflictWarning] : undefined
        }
      />
    </div>
  );
};

export default ShiftChange;
