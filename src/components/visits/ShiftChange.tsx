import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useFilterContext } from "../../context/Filter.context";
import { useLocationContext } from "../../context/Location.context";
import { useShiftContext } from "../../context/Shift.context";
import { useUserContext } from "../../context/User.context";
import { DateRangeKey, RoleEnum, commonDateOptions } from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetShifts } from "../../utils/api/shift";
import { useCreateShiftChangeRequest } from "../../utils/api/shiftChangeRequest";
import { useGetAllUserRoles, useGetUsersMinimal } from "../../utils/api/user";
import { convertDateFormat, formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

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
  const users = useGetUsersMinimal();

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
  const { selectedLocationId: globalSelectedLocationId } = useLocationContext();
  const [selectedLocationId, setSelectedLocationId] = useState(
    globalSelectedLocationId
  );
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

  // Separate shifts data for modal - fetch ALL locations
  const modalShifts = useGetShifts(
    filterPanelFormElements?.after,
    filterPanelFormElements?.before,
    -1 // Fetch all locations for modal dropdown
  );
  const { user } = useUserContext();
  const isDisabledCondition = user
    ? ![
        RoleEnum.MANAGER,
        RoleEnum.GAMEMANAGER,
        RoleEnum.OPERATIONSASISTANT,
      ].includes(user?.role?._id)
    : true;
  const { showShiftsFilters, setShowShiftsFilters } = useFilterContext();
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

                  if (!shiftLocation.users || shiftLocation.users.length === 0)
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

  // Get user's own shifts (all shifts where user is assigned) - using modalShifts
  const userOwnShifts = modalShifts?.filter((shift) => {
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
  const userLocations =
    locations
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
      if (
        !shift.location ||
        shift.location !== shiftChangeForm.sourceLocation ||
        !shift.day
      ) {
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
        value: `${shiftRecord._id}|${s.shift}|${s.shiftEndHour || ""}|${
          shiftRecord.day
        }`,
        label: `${convertDateFormat(shiftRecord.day)}   /   ${s.shift}${
          s.shiftEndHour ? `-${s.shiftEndHour}` : ""
        }`,
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

  // Get all shifts for target location (for SWAP) - only today and future - using modalShifts
  const targetLocationShifts = modalShifts?.filter((shift) => {
    if (
      !shift.location ||
      shift.location !== shiftChangeForm.targetLocation ||
      !shift.day
    ) {
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
            ?.filter(
              (s: any) => s.user && s.user.includes(shiftChangeForm.targetUser)
            )
            ?.map((s: any) => ({
              value: `${shiftRecord._id}|${s.shift}|${s.shiftEndHour || ""}|${
                shiftRecord.day
              }|${s.user.join(",")}`,
              label: `${convertDateFormat(shiftRecord.day)} / ${s.shift}${
                s.shiftEndHour ? ` - ${s.shiftEndHour}` : ""
              }`,
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
  const swapFields =
    shiftChangeForm.type === "SWAP"
      ? [
          {
            type: InputTypes.SELECT,
            formKey: "targetLocation",
            label: t("Target Location"),
            options:
              locations?.map((loc) => ({ value: loc._id, label: loc.name })) ||
              [],
            required: true,
            invalidateKeys: [
              { key: "targetUser", defaultValue: "" },
              { key: "targetShift", defaultValue: "" },
            ],
          },
          {
            type: InputTypes.SELECT,
            formKey: "targetUser",
            label: t("Target User"),
            options:
              users
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
        ]
      : [];

  // TRANSFER-specific fields
  const transferFields =
    shiftChangeForm.type === "TRANSFER"
      ? [
          {
            type: InputTypes.SELECT,
            formKey: "targetUser",
            label: t("Transfer To User"),
            options:
              users
                ?.filter((u) => u._id !== user?._id)
                ?.map((u) => ({ value: u._id, label: u.name })) || [],
            required: true,
            invalidateKeys: [],
          },
        ]
      : [];

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
      const [
        targetShiftId,
        targetStartTime,
        targetEndTime,
        targetDay,
        targetUsers,
      ] = formData.targetShift.split("|");

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

  // Helper function to parse time and check overlap
  const checkTimeOverlap = (
    start1: string,
    end1: string | undefined,
    start2: string,
    end2: string | undefined
  ): boolean => {
    const [start1Hour, start1Min] = start1.split(":").map(Number);
    const start1Minutes = start1Hour * 60 + start1Min;

    const [start2Hour, start2Min] = start2.split(":").map(Number);
    const start2Minutes = start2Hour * 60 + start2Min;

    let end1Minutes: number;
    if (end1) {
      const [end1Hour, end1Min] = end1.split(":").map(Number);
      end1Minutes = end1Hour * 60 + end1Min;
    } else {
      end1Minutes = start1Minutes + 8 * 60; // Default 8 hours
    }

    let end2Minutes: number;
    if (end2) {
      const [end2Hour, end2Min] = end2.split(":").map(Number);
      end2Minutes = end2Hour * 60 + end2Min;
    } else {
      end2Minutes = start2Minutes + 8 * 60; // Default 8 hours
    }

    // Check if times overlap
    return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
  };

  // Conflict detection for TRANSFER and SWAP - using modalShifts
  useEffect(() => {
    if (shiftChangeForm.type === "TRANSFER") {
      // TRANSFER: Check if target user has overlapping shift on same day (any location)
      if (shiftChangeForm.sourceShift && shiftChangeForm.targetUser) {
        const [, sourceStartTime, sourceEndTime, sourceDay] =
          shiftChangeForm.sourceShift.split("|");

        // Find all shifts for target user on the same day (any location)
        const targetUserShifts = modalShifts?.filter(
          (shift) =>
            shift.day === sourceDay &&
            shift.shifts?.some((s: any) =>
              s.user?.includes(shiftChangeForm.targetUser)
            )
        );

        // Check for time conflicts and collect conflicting shift info
        let conflictingShift: {
          location: string;
          startTime: string;
          endTime: string;
        } | null = null as {
          location: string;
          startTime: string;
          endTime: string;
        } | null;

        const hasConflict = targetUserShifts?.some((shiftRecord) =>
          shiftRecord.shifts?.some((s: any) => {
            if (!s.user?.includes(shiftChangeForm.targetUser)) return false;

            const isOverlap = checkTimeOverlap(
              sourceStartTime,
              sourceEndTime,
              s.shift,
              s.shiftEndHour
            );

            if (isOverlap) {
              const location = getItem(shiftRecord.location, locations);
              conflictingShift = {
                location: location?.name || "Bilinmeyen Lokasyon",
                startTime: s.shift,
                endTime: s.shiftEndHour || "",
              };
            }

            return isOverlap;
          })
        );

        if (hasConflict && conflictingShift) {
          const targetUserName = getItem(
            shiftChangeForm.targetUser,
            users
          )?.name;
          setConflictWarning(
            t(
              "Warning: {{userName}} already has a shift at this time on {{date}}",
              {
                userName: targetUserName,
                date: convertDateFormat(sourceDay),
              }
            ) +
              `\n${t("Conflicting Shift")}: ${conflictingShift.location} (${
                conflictingShift.startTime
              }${conflictingShift.endTime ? `-${conflictingShift.endTime}` : ""})`
          );
        } else {
          setConflictWarning("");
        }
      } else {
        setConflictWarning("");
      }
    } else if (shiftChangeForm.type === "SWAP") {
      // SWAP: Only check if different day OR different location
      if (
        shiftChangeForm.sourceShift &&
        shiftChangeForm.targetShift &&
        shiftChangeForm.targetUser
      ) {
        const [, sourceStartTime, sourceEndTime, sourceDay] =
          shiftChangeForm.sourceShift.split("|");
        const [, targetStartTime, targetEndTime, targetDay] =
          shiftChangeForm.targetShift.split("|");

        const sameDay = sourceDay === targetDay;

        if (!sameDay) {
          // Different day - check for overlaps (different users will have shifts on different days)
          let hasConflict = false;
          let conflictMessage = "";

          // Check if requester has overlap on target day
          const requesterShiftsOnTargetDay = modalShifts?.filter(
            (shift) =>
              shift.day === targetDay &&
              shift.shifts?.some((s: any) => s.user?.includes(user?._id))
          );

          let requesterConflictingShift: {
            location: string;
            startTime: string;
            endTime: string;
          } | null = null as {
            location: string;
            startTime: string;
            endTime: string;
          } | null;

          const requesterHasOverlap = requesterShiftsOnTargetDay?.some(
            (shiftRecord) =>
              shiftRecord.shifts?.some((s: any) => {
                if (!s.user?.includes(user?._id)) return false;

                // Exclude the target shift itself (the shift we want to take)
                if (
                  shiftRecord._id?.toString() ===
                    shiftChangeForm.targetShift?.split("|")[0] &&
                  s.shift === targetStartTime
                ) {
                  return false;
                }

                // Exclude the source shift (our own shift that we're swapping)
                if (
                  shiftRecord._id?.toString() ===
                    shiftChangeForm.sourceShift?.split("|")[0] &&
                  s.shift === sourceStartTime
                ) {
                  return false;
                }

                const isOverlap = checkTimeOverlap(
                  targetStartTime,
                  targetEndTime,
                  s.shift,
                  s.shiftEndHour
                );

                if (isOverlap) {
                  const location = getItem(shiftRecord.location, locations);
                  requesterConflictingShift = {
                    location: location?.name || "Bilinmeyen Lokasyon",
                    startTime: s.shift,
                    endTime: s.shiftEndHour || "",
                  };
                }

                return isOverlap;
              })
          );

          if (requesterHasOverlap && requesterConflictingShift) {
            hasConflict = true;
            const targetUserName = getItem(
              shiftChangeForm.targetUser,
              users
            )?.name;

            // Show target user's shift info
            const targetShiftLocation =
              getItem(shiftChangeForm.targetLocation, locations)?.name ||
              "Bilinmeyen Lokasyon";

            conflictMessage =
              t("Warning: You have an overlapping shift on {{date}}", {
                date: convertDateFormat(targetDay),
              }) +
              `\n${t("{{userName}}'s Shift", {
                userName: targetUserName,
              })}: ${targetShiftLocation} (${targetStartTime}${
                targetEndTime ? `-${targetEndTime}` : ""
              })`;
          }

          // Check if target user has overlap on source day
          if (!hasConflict) {
            const targetUserShiftsOnSourceDay = modalShifts?.filter(
              (shift) =>
                shift.day === sourceDay &&
                shift.shifts?.some((s: any) =>
                  s.user?.includes(shiftChangeForm.targetUser)
                )
            );

            let targetConflictingShift: {
              location: string;
              startTime: string;
              endTime: string;
            } | null = null as {
              location: string;
              startTime: string;
              endTime: string;
            } | null;

            const targetHasOverlap = targetUserShiftsOnSourceDay?.some(
              (shiftRecord) =>
                shiftRecord.shifts?.some((s: any) => {
                  if (!s.user?.includes(shiftChangeForm.targetUser))
                    return false;

                  // Exclude the source shift itself
                  if (
                    shiftRecord._id?.toString() ===
                      shiftChangeForm.sourceShift?.split("|")[0] &&
                    s.shift === sourceStartTime
                  ) {
                    return false;
                  }

                  const isOverlap = checkTimeOverlap(
                    sourceStartTime,
                    sourceEndTime,
                    s.shift,
                    s.shiftEndHour
                  );

                  if (isOverlap) {
                    const location = getItem(shiftRecord.location, locations);
                    targetConflictingShift = {
                      location: location?.name || "Bilinmeyen Lokasyon",
                      startTime: s.shift,
                      endTime: s.shiftEndHour || "",
                    };
                  }

                  return isOverlap;
                })
            );

            if (targetHasOverlap && targetConflictingShift) {
              hasConflict = true;
              const targetUserName = getItem(
                shiftChangeForm.targetUser,
                users
              )?.name;
              conflictMessage =
                t(
                  "Warning: {{userName}} has an overlapping shift on {{date}}",
                  {
                    userName: targetUserName,
                    date: convertDateFormat(sourceDay),
                  }
                ) +
                `\n${t("Conflicting Shift")}: ${
                  targetConflictingShift.location
                } (${targetConflictingShift.startTime}${
                  targetConflictingShift.endTime
                    ? `-${targetConflictingShift.endTime}`
                    : ""
                })`;
            }
          }

          if (hasConflict) {
            setConflictWarning(conflictMessage);
          } else {
            setConflictWarning("");
          }
        } else {
          // Same day - allow swap without overlap check (shifts will replace each other)
          setConflictWarning("");
        }
      } else {
        setConflictWarning("");
      }
    } else {
      setConflictWarning("");
    }
  }, [
    shiftChangeForm.type,
    shiftChangeForm.sourceShift,
    shiftChangeForm.targetShift,
    shiftChangeForm.sourceLocation,
    shiftChangeForm.targetLocation,
    shiftChangeForm.targetUser,
    modalShifts,
    users,
    user?._id,
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
        generalClassName="max-h-[90vh] overflow-y-auto"
        isSubmitButtonActive={!conflictWarning}
        constantValues={shiftChangeForm}
        setForm={setShiftChangeForm}
        upperMessage={
          conflictWarning
            ? [t("Conflict Detected!"), conflictWarning]
            : undefined
        }
      />
    </div>
  );
};

export default ShiftChange;
