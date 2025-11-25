import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useFilterContext } from "../../context/Filter.context";
import { useLocationContext } from "../../context/Location.context";
import { useShiftContext } from "../../context/Shift.context";
import { useUserContext } from "../../context/User.context";
import { DateRangeKey, RoleEnum, Shift, ShiftValue, commonDateOptions } from "../../types";
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

  const [isShiftChangeModalOpen, setIsShiftChangeModalOpen] = useState(false);
  const [shiftChangeForm, setShiftChangeForm] = useState<ShiftChangeFormState>({
    type: "SWAP",
  });
  const [conflictWarning, setConflictWarning] = useState<string>("");
  const [modalKey, setModalKey] = useState(0);
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

  const filterUsersByRole = (userId: string) => {
    const foundUser = getItem(userId, users);
    return (
      foundUser &&
      (!filterPanelFormElements?.role ||
        filterPanelFormElements?.role?.length === 0 ||
        filterPanelFormElements?.role?.includes(foundUser?.role?._id))
    );
  };

  const isDateValidForShiftChange = (shiftDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(shiftDate);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck >= today;
  };

  const buildConflictWarningMessage = (
    userName: string | undefined,
    day: string,
    locationId: number | undefined,
    shift: { shift?: string; shiftEndHour?: string } | undefined
  ) => {
    if (!locationId || !shift) return "";

    const location = getItem(locationId, locations);
    const isCurrentUser = userName === user?.name;

    const warningBase = isCurrentUser
      ? t("Warning: You already have another shift on {{date}}", {
          date: convertDateFormat(day),
        })
      : t("Warning: {{userName}} already has another shift on {{date}}", {
          userName,
          date: convertDateFormat(day),
        });

    return (
      warningBase +
      `\n${t("Conflicting Shift")}: ${convertDateFormat(day)} - ${
        location?.name || t("Unknown Location")
      } (${shift?.shift || ""}${
        shift?.shiftEndHour ? `-${shift.shiftEndHour}` : ""
      })`
    );
  };

  const findUserShiftsOnDay = (
    userId: string | undefined,
    day: string,
    excludeShiftId?: string,
    excludeShiftTime?: string
  ): Shift[] | undefined => {
    if (!userId) return undefined;

    return modalShifts?.filter((shift) =>
      shift.day === day &&
      shift.shifts?.some((s: ShiftValue) => {
        if (!s.user?.includes(userId)) return false;

        if (
          excludeShiftId &&
          excludeShiftTime &&
          shift._id?.toString() === excludeShiftId &&
          s.shift === excludeShiftTime
        ) {
          return false;
        }

        return true;
      })
    );
  };

  const extractShiftFromShifts = (
    shifts: Shift[],
    userId: string | undefined,
    excludeShiftId?: string,
    excludeShiftTime?: string
  ): ShiftValue | undefined => {
    if (!userId) return undefined;

    return shifts?.[0]?.shifts?.find((s: ShiftValue) => {
      if (!s.user?.includes(userId)) return false;

      if (
        excludeShiftId &&
        excludeShiftTime &&
        shifts[0]._id?.toString() === excludeShiftId &&
        s.shift === excludeShiftTime
      ) {
        return false;
      }

      return true;
    });
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

  const modalShifts = useGetShifts(
    filterPanelFormElements?.after,
    filterPanelFormElements?.before,
    -1
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

          return shiftsArray.sort((a, b) => {
            const [aHour, aMin] = a.shift.split(":").map(Number);
            const [bHour, bMin] = b.shift.split(":").map(Number);
            return aHour * 60 + aMin - (bHour * 60 + bMin);
          });
        })()
      : foundLocation?.shifts || [];

  const formatDayWithWeekday = (day: string) => {
    const dayName = new Date(day).toLocaleDateString("en-US", {
      weekday: "long",
    });
    return convertDateFormat(day) + "  " + "(" + t(dayName) + ")";
  };

  const buildAllLocationsRows = () => {
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
          const locationHasShift = locationConfig?.shifts?.some(
            (locationShift) =>
              buildShiftKey(locationShift, shiftRecord.location) === shiftKey
          );

          if (!locationHasShift) {
            return;
          }

          const existingIndex = shiftsByLocation[shiftKey].findIndex(
            (sl) => sl.location === shiftRecord.location
          );

          if (existingIndex === -1) {
            shiftsByLocation[shiftKey].push({
              location: shiftRecord.location,
              users: s.user?.filter(filterUsersByRole) || [],
              chefUser: s.chefUser,
              _id: shiftRecord._id,
            });
          }
        });
      });

      return {
        day,
        formattedDay: formatDayWithWeekday(day),
        shiftsByLocation,
      };
    });
  };

  const buildSingleLocationRows = () => {
    return shifts?.map((shift) => {
      const shiftMapping = shift?.shifts?.reduce((acc, shiftValue) => {
        if (shiftValue.shift && shiftValue.user) {
          acc[shiftValue.shift] = shiftValue.user?.filter(filterUsersByRole);
        }
        return acc;
      }, {} as { [key: string]: string[] });

      return {
        ...shift,
        formattedDay: formatDayWithWeekday(shift.day),
        ...shiftMapping,
      };
    });
  };

  const allRows =
    selectedLocationId === -1
      ? buildAllLocationsRows()
      : buildSingleLocationRows();
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

  const shiftChangeButton = {
    name: t("Change Working Hours"),
    isModal: true,
    modal: null,
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

  const userOwnShifts = modalShifts?.filter((shift) => {
    const hasUser = shift.shifts?.some((s: any) => {
      if (Array.isArray(s.user)) {
        return s.user.includes(user?._id);
      }
      return s.user === user?._id;
    });
    return hasUser;
  });

  const userLocations =
    locations
      ?.map((location) => ({
        value: location._id,
        label: location.name || "",
      }))
      .filter((loc) => loc.label) || [];

  const userShiftsInLocation = userOwnShifts
    ?.filter((shift) => {
      if (
        !shift.location ||
        shift.location !== shiftChangeForm.sourceLocation ||
        !shift.day
      ) {
        return false;
      }
      return isDateValidForShiftChange(shift.day);
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

  const targetLocationShifts = modalShifts?.filter((shift) => {
    if (
      !shift.location ||
      shift.location !== shiftChangeForm.targetLocation ||
      !shift.day
    ) {
      return false;
    }
    return isDateValidForShiftChange(shift.day);
  });

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

  const baseInputs = [
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
        setShiftChangeForm({ type: selectedValue as "SWAP" | "TRANSFER" });
        setModalKey((prev) => prev + 1);
      },
    },
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

  const noteField = {
    type: InputTypes.TEXTAREA,
    formKey: "requesterNote",
    label: t("Reason"),
    required: true,
    invalidateKeys: [],
  } as any;

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

  const resetShiftChangeModal = () => {
    setIsShiftChangeModalOpen(false);
    setShiftChangeForm({ type: "SWAP" });
    setConflictWarning("");
    setModalKey((prev) => prev + 1);
  };

  const buildShiftPayload = (
    shiftId: string,
    day: string,
    startTime: string,
    endTime: string,
    location: number,
    userId: string
  ) => ({
    shiftId: Number(shiftId),
    day,
    startTime,
    endTime: endTime || undefined,
    location,
    userId,
  });

  const handleShiftChangeSubmit = (formData: any) => {
    if (conflictWarning) {
      toast.error(t("Cannot submit: User has a conflicting shift"));
      return;
    }

    const [sourceShiftId, sourceStartTime, sourceEndTime, sourceDay] =
      formData.sourceShift.split("|");

    if (formData.type === "SWAP") {
      const [
        targetShiftId,
        targetStartTime,
        targetEndTime,
        targetDay,
        targetUsers,
      ] = formData.targetShift.split("|");

      const targetUserId = formData.targetUser || targetUsers.split(",")[0];

      const payload = {
        targetUserId,
        requesterShift: buildShiftPayload(
          sourceShiftId,
          sourceDay,
          sourceStartTime,
          sourceEndTime,
          formData.sourceLocation,
          user?._id || ""
        ),
        targetShift: buildShiftPayload(
          targetShiftId,
          targetDay,
          targetStartTime,
          targetEndTime,
          formData.targetLocation,
          targetUserId
        ),
        type: "SWAP" as "SWAP" | "TRANSFER",
        requesterNote: formData.requesterNote,
      };

      createShiftChangeRequest(payload, {
        onSuccess: resetShiftChangeModal,
      });
    } else if (formData.type === "TRANSFER") {
      const payload = {
        targetUserId: formData.targetUser,
        requesterShift: buildShiftPayload(
          sourceShiftId,
          sourceDay,
          sourceStartTime,
          sourceEndTime,
          formData.sourceLocation,
          user?._id || ""
        ),
        targetShift: buildShiftPayload(
          sourceShiftId,
          sourceDay,
          sourceStartTime,
          sourceEndTime,
          formData.sourceLocation,
          formData.targetUser
        ),
        type: "TRANSFER" as "SWAP" | "TRANSFER",
        requesterNote: formData.requesterNote,
      };

      createShiftChangeRequest(payload, {
        onSuccess: resetShiftChangeModal,
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

  useEffect(() => {
    const checkTransferConflict = () => {
      if (!shiftChangeForm.sourceShift || !shiftChangeForm.targetUser) {
        return "";
      }

      const [, , , sourceDay] = shiftChangeForm.sourceShift.split("|");
      const targetUserShiftsOnDay = findUserShiftsOnDay(
        shiftChangeForm.targetUser,
        sourceDay
      );

      if (targetUserShiftsOnDay && targetUserShiftsOnDay.length > 0) {
        const targetUserName = getItem(shiftChangeForm.targetUser, users)?.name;
        const firstShift = extractShiftFromShifts(
          targetUserShiftsOnDay,
          shiftChangeForm.targetUser
        );

        return buildConflictWarningMessage(
          targetUserName,
          sourceDay,
          targetUserShiftsOnDay[0].location,
          firstShift
        );
      }

      return "";
    };

    const checkSwapConflict = () => {
      if (
        !shiftChangeForm.sourceShift ||
        !shiftChangeForm.targetShift ||
        !shiftChangeForm.targetUser
      ) {
        return "";
      }

      const [, sourceStartTime, , sourceDay] =
        shiftChangeForm.sourceShift.split("|");
      const [targetShiftId, targetStartTime, , targetDay] =
        shiftChangeForm.targetShift.split("|");
      const [sourceShiftId] = shiftChangeForm.sourceShift.split("|");

      const sameDay = sourceDay === targetDay;

      // Check target user conflicts
      const targetUserConflicts = findUserShiftsOnDay(
        shiftChangeForm.targetUser,
        sourceDay,
        targetShiftId,
        targetStartTime
      );

      if (targetUserConflicts && targetUserConflicts.length > 0) {
        const targetUserName = getItem(shiftChangeForm.targetUser, users)?.name;
        const otherShift = extractShiftFromShifts(
          targetUserConflicts,
          shiftChangeForm.targetUser,
          targetShiftId,
          targetStartTime
        );

        return buildConflictWarningMessage(
          targetUserName,
          sourceDay,
          targetUserConflicts[0].location,
          otherShift
        );
      }

      // Check requester conflicts
      const checkDay = sameDay ? sourceDay : targetDay;
      const requesterConflicts = findUserShiftsOnDay(
        user?._id,
        checkDay,
        sourceShiftId,
        sourceStartTime
      );

      if (requesterConflicts && requesterConflicts.length > 0) {
        const otherShift = extractShiftFromShifts(
          requesterConflicts,
          user?._id,
          sourceShiftId,
          sourceStartTime
        );

        return buildConflictWarningMessage(
          user?.name,
          checkDay,
          requesterConflicts[0].location,
          otherShift
        );
      }

      return "";
    };

    if (shiftChangeForm.type === "TRANSFER") {
      setConflictWarning(checkTransferConflict());
    } else if (shiftChangeForm.type === "SWAP") {
      setConflictWarning(checkSwapConflict());
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

      <GenericAddEditPanel
        key={modalKey}
        isOpen={isShiftChangeModalOpen}
        close={resetShiftChangeModal}
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
