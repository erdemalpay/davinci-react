import {
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { enUS, tr } from "date-fns/locale";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCircle, FaRegCircle, FaRegStar, FaStar } from "react-icons/fa";
import { GoPlusCircle } from "react-icons/go";
import { useFilterContext } from "../../context/Filter.context";
import { useLocationContext } from "../../context/Location.context";
import { useUserContext } from "../../context/User.context";
import { ActionEnum, DisabledConditionEnum, Shift, ShiftValue } from "../../types";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { useGetShifts, useShiftMutations } from "../../utils/api/shift";
import { useGetAllUserRoles, useGetUsersMinimal } from "../../utils/api/user";
import { convertDateFormat } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { MonthlyBody, MonthlyDay } from "../calendar/MonthlyBody";
import { MonthlyCalendar, MonthlyNav } from "../calendar/MonthlyCalendar";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import FilterPanel from "../panelComponents/Tables/FilterPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type ShiftCalendarEvent = Shift & { date: string };

const DEFAULT_FALLBACK_COLOR = "#6B7280";

export default function ShiftsCalendar() {
  const { t, i18n } = useTranslation();
  const calendarLocale = i18n.language?.startsWith("tr") ? tr : enUS;
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(new Date())
  );
  const { selectedLocationId: globalLocationId } = useLocationContext();
  const [selectedLocationId, setSelectedLocationId] = useState(
    globalLocationId
  );
  const locations = useGetStoreLocations();
  const users = useGetUsersMinimal();
  const roles = useGetAllUserRoles();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();
  const shiftsDisabledCondition = getItem(
    DisabledConditionEnum.VISITS_SHIFTS,
    disabledConditions
  );
  const {
    isChefAssignOpen,
    setIsChefAssignOpen,
    isMiddlemanAssignOpen,
    setIsMiddlemanAssignOpen,
    isShiftsEnableEdit,
    setIsShiftsEnableEdit,
  } = useFilterContext();
  const canAssignChef = !shiftsDisabledCondition?.actions?.some(
    (ac) =>
      ac.action === ActionEnum.ASSIGN_CHEF &&
      user?.role?._id &&
      !ac?.permissionsRoles?.includes(user?.role?._id)
  );
  const canAssignMiddleman = !shiftsDisabledCondition?.actions?.some(
    (ac) =>
      ac.action === ActionEnum.ASSIGN_MIDDLEMAN &&
      user?.role?._id &&
      !ac?.permissionsRoles?.includes(user?.role?._id)
  );
  const canEnableEdit = !shiftsDisabledCondition?.actions?.some(
    (ac) =>
      ac.action === ActionEnum.ENABLEEDIT &&
      user?.role?._id &&
      !ac?.permissionsRoles?.includes(user?.role?._id)
  );

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [activeEntry, setActiveEntry] = useState<{
    locationId: number;
    shiftLabel: string;
    shiftEndHour?: string;
    shiftRecordId?: number;
    day: string;
    users: string[];
  } | null>(null);
  const [assignForm, setAssignForm] = useState<{ selectedUsers: string[] }>({
    selectedUsers: [],
  });

  const [showFilters, setShowFilters] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] = useState<{
    role: number[];
    user: string;
  }>({ role: [], user: "" });
  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "role",
      label: t("Roles"),
      options: roles?.map((role) => ({ value: role._id, label: role.name })),
      isMultiple: true,
      placeholder: t("Roles"),
      required: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "user",
      label: t("User"),
      options: users
        ?.filter((u) => {
          if (filterPanelFormElements?.role?.length > 0) {
            return filterPanelFormElements.role.includes(u?.role?._id);
          }
          return true;
        })
        ?.map((u) => ({ value: u._id, label: u.name })),
      placeholder: t("User"),
      required: false,
    },
  ];
  const matchesShiftFilters = (userId: string) => {
    const foundUser = getItem(userId, users);
    if (!foundUser) return false;
    if (
      filterPanelFormElements?.role?.length > 0 &&
      !filterPanelFormElements.role.includes(foundUser.role?._id)
    ) {
      return false;
    }
    if (
      filterPanelFormElements?.user &&
      filterPanelFormElements.user !== userId
    ) {
      return false;
    }
    return true;
  };

  // include the leading/trailing days of the adjacent months that show up
  // as shaded overflow cells on the calendar grid (week starts on Monday)
  const after = format(
    startOfWeek(currentMonth, { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  );
  const before = format(
    endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  );

  const shifts = useGetShifts(after, before, selectedLocationId);
  const { updateShift, createShift } = useShiftMutations(
    after,
    before,
    selectedLocationId
  );

  const events: ShiftCalendarEvent[] = (shifts || []).map((shift) => ({
    ...shift,
    date: shift.day,
  }));

  return (
    <div className="__className_a182b8 w-[95%] mx-auto">
      <div className="mt-4 text-sm text-gray-500">
        {t("Calendar Info Text")}
      </div>
      <div className="my-4 flex justify-end">
        <div className="flex gap-2 flex-wrap">
          <ButtonFilter
            buttonName={t("All")}
            onclick={() => setSelectedLocationId(-1)}
            backgroundColor={DEFAULT_FALLBACK_COLOR}
            isActive={selectedLocationId === -1}
          />
          {locations.map((location) => (
            <ButtonFilter
              key={location._id}
              buttonName={location.name}
              onclick={() => setSelectedLocationId(location._id)}
              backgroundColor={location.backgroundColor}
              isActive={selectedLocationId === location._id}
            />
          ))}
        </div>
      </div>
      <div className="my-4 flex justify-end gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm">{t("Chef Assign")}</span>
          <SwitchButton
            checked={isChefAssignOpen}
            onChange={() =>
              canAssignChef && setIsChefAssignOpen(!isChefAssignOpen)
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">{t("Assign Middleman")}</span>
          <SwitchButton
            checked={isMiddlemanAssignOpen}
            onChange={() =>
              canAssignMiddleman &&
              setIsMiddlemanAssignOpen(!isMiddlemanAssignOpen)
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">{t("Enable Edit")}</span>
          <SwitchButton
            checked={isShiftsEnableEdit}
            onChange={() =>
              canEnableEdit && setIsShiftsEnableEdit(!isShiftsEnableEdit)
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">{t("Show Filters")}</span>
          <SwitchButton
            checked={showFilters}
            onChange={() => setShowFilters(!showFilters)}
          />
        </div>
      </div>
      <div className={showFilters ? "flex flex-row gap-2" : ""}>
        {showFilters && (
          <FilterPanel
            isFilterPanelActive={showFilters}
            inputs={filterPanelInputs}
            formElements={filterPanelFormElements as any}
            setFormElements={setFilterPanelFormElements as any}
            closeFilters={() => setShowFilters(false)}
            additionalFilterCleanFunction={() =>
              setFilterPanelFormElements({ role: [], user: "" })
            }
          />
        )}
        <div className="flex-1">
      <MonthlyCalendar
        currentMonth={currentMonth}
        onCurrentMonthChange={(date) => setCurrentMonth(date)}
        locale={calendarLocale}
      >
        <MonthlyNav />
        <MonthlyBody<ShiftCalendarEvent> events={events} showOverflowDays>
          <MonthlyDay<ShiftCalendarEvent>
            listClassName="grid grid-cols-2 gap-x-2 overflow-hidden max-h-36 overflow-y-auto"
            dayClassName={(day, isOutsideMonth) => {
              if (isOutsideMonth) return "";
              const today = startOfDay(new Date());
              if (isSameDay(day, today)) return "bg-yellow-100";
              if (isBefore(day, today)) return "bg-red-50";
              return "";
            }}
            renderDay={(dayShifts, day) => {
              const dayStr = format(day, "yyyy-MM-dd");
              type LocationEntry = {
                locationId: number;
                users: string[];
                displayUsers: string[];
                shiftRecordId?: number;
                shiftLabel: string;
                shiftEndHour?: string;
                chefUser?: string;
                middlemanUser?: string;
              };
              type SlotEntry = {
                label: string;
                startMinutes: number;
                locationEntries: LocationEntry[];
              };
              const slotMap = new Map<string, SlotEntry>();

              const toggleAssignment = (
                entry: LocationEntry,
                userId: string,
                field: "chefUser" | "middlemanUser"
              ) => {
                const record = shifts?.find(
                  (s) => s._id === entry.shiftRecordId
                );
                if (!record) return;
                const updatedShifts = record.shifts?.map((s: ShiftValue) => {
                  if (
                    s.shift === entry.shiftLabel &&
                    (s.shiftEndHour || "") === (entry.shiftEndHour || "")
                  ) {
                    return {
                      ...s,
                      [field]: s[field] === userId ? "" : userId,
                    };
                  }
                  return s;
                });
                updateShift({
                  id: record._id,
                  updates: { shifts: updatedShifts },
                });
              };

              const locationsToShow =
                selectedLocationId === -1
                  ? locations
                  : locations.filter((l) => l._id === selectedLocationId);

              locationsToShow.forEach((location) => {
                const locationId = location._id;
                const shiftRecord = dayShifts.find(
                  (s) => (s.location ?? -1) === locationId
                );
                const definedShifts = location?.shifts?.length
                  ? location.shifts
                  : shiftRecord?.shifts;

                definedShifts?.forEach((definedShift) => {
                  const key = `${definedShift.shift}${
                    definedShift.shiftEndHour ? `-${definedShift.shiftEndHour}` : ""
                  }`;
                  let slot = slotMap.get(key);
                  if (!slot) {
                    const [h, m] = definedShift.shift.split(":").map(Number);
                    slot = { label: key, startMinutes: h * 60 + (m || 0), locationEntries: [] };
                    slotMap.set(key, slot);
                  }
                  const existing = slot.locationEntries.find(
                    (e) => e.locationId === locationId
                  );
                  if (existing) return;

                  const sv = shiftRecord?.shifts?.find(
                    (s) =>
                      s.shift === definedShift.shift &&
                      (s.shiftEndHour || "") === (definedShift.shiftEndHour || "")
                  );
                  const svUsers = sv?.user || [];
                  slot.locationEntries.push({
                    locationId,
                    users: svUsers,
                    displayUsers: svUsers.filter(matchesShiftFilters),
                    shiftRecordId: shiftRecord?._id,
                    shiftLabel: definedShift.shift,
                    shiftEndHour: definedShift.shiftEndHour,
                    chefUser: sv?.chefUser,
                    middlemanUser: sv?.middlemanUser,
                  });
                });
              });

              const sortedSlots = Array.from(slotMap.values()).sort(
                (a, b) => a.startMinutes - b.startMinutes
              );
              const isAllMode = selectedLocationId === -1;

              const openAssignModal = (entry: LocationEntry) => {
                setActiveEntry({
                  locationId: entry.locationId,
                  shiftLabel: entry.shiftLabel,
                  shiftEndHour: entry.shiftEndHour,
                  shiftRecordId: entry.shiftRecordId,
                  day: dayStr,
                  users: entry.users,
                });
                setAssignForm({ selectedUsers: entry.users });
                setIsAssignModalOpen(true);
              };

              return (
                <>
                  {sortedSlots.map((slot) => {
                    return (
                      <li key={slot.label} className="mb-1">
                        <div className="flex items-center gap-1 mb-0.5">
                          <div className="text-xs font-semibold text-gray-500">
                            {slot.label}
                          </div>
                          {isShiftsEnableEdit && !isAllMode && (
                            <GoPlusCircle
                              className="text-green-600 cursor-pointer shrink-0"
                              onClick={() =>
                                openAssignModal(slot.locationEntries[0])
                              }
                            />
                          )}
                        </div>
                        {slot.locationEntries.map((entry) => {
                          const location = getItem(entry.locationId, locations);
                          return (
                            <div key={entry.locationId} className="mb-0.5">
                              {isAllMode && location && (
                                <div className="flex items-center gap-1 mb-0.5">
                                  <div
                                    className="text-xs font-semibold"
                                    style={{
                                      color:
                                        location.backgroundColor || DEFAULT_FALLBACK_COLOR,
                                    }}
                                  >
                                    {location.name}
                                  </div>
                                  {isShiftsEnableEdit && (
                                    <GoPlusCircle
                                      className="text-green-600 cursor-pointer shrink-0"
                                      onClick={() => openAssignModal(entry)}
                                    />
                                  )}
                                </div>
                              )}
                              <div className="flex flex-wrap gap-0.5">
                                {entry.displayUsers.map((userId, idx) => {
                                  const foundUser = getItem(userId, users);
                                  if (!foundUser) return null;
                                  const isChef = entry.chefUser === userId;
                                  const isMiddleman =
                                    entry.middlemanUser === userId;
                                  return (
                                    <span
                                      key={`${userId}-${idx}`}
                                      className="flex items-center gap-0.5 text-xs px-1 py-0.5 rounded text-white leading-tight"
                                      style={{
                                        backgroundColor:
                                          foundUser.role?.color || DEFAULT_FALLBACK_COLOR,
                                      }}
                                    >
                                      {foundUser.name}
                                      <span
                                        className={`text-yellow-300 ${
                                          isChefAssignOpen && canAssignChef
                                            ? "cursor-pointer"
                                            : "cursor-default"
                                        }`}
                                        onClick={() => {
                                          if (!isChefAssignOpen || !canAssignChef)
                                            return;
                                          toggleAssignment(
                                            entry,
                                            userId,
                                            "chefUser"
                                          );
                                        }}
                                      >
                                        {isChef ? (
                                          <FaStar />
                                        ) : isChefAssignOpen ? (
                                          <FaRegStar />
                                        ) : null}
                                      </span>
                                      <span
                                        className={`text-purple-200 ${
                                          isMiddlemanAssignOpen &&
                                          canAssignMiddleman
                                            ? "cursor-pointer"
                                            : "cursor-default"
                                        }`}
                                        onClick={() => {
                                          if (
                                            !isMiddlemanAssignOpen ||
                                            !canAssignMiddleman
                                          )
                                            return;
                                          toggleAssignment(
                                            entry,
                                            userId,
                                            "middlemanUser"
                                          );
                                        }}
                                      >
                                        {isMiddleman ? (
                                          <FaCircle />
                                        ) : isMiddlemanAssignOpen ? (
                                          <FaRegCircle />
                                        ) : null}
                                      </span>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </li>
                    );
                  })}
                </>
              );
            }}
          />
        </MonthlyBody>
      </MonthlyCalendar>
        </div>
      </div>
      {activeEntry && (
        <GenericAddEditPanel
          isOpen={isAssignModalOpen}
          close={() => {
            setIsAssignModalOpen(false);
            setActiveEntry(null);
          }}
          centerOnMobile
          header={t("Assign Shift")}
          upperMessage={[
            `${t("Location")}: ${
              getItem(activeEntry.locationId, locations)?.name ?? ""
            }`,
            `${t("Date")}: ${convertDateFormat(activeEntry.day)}`,
            `${t("Shift")}: ${activeEntry.shiftLabel}${
              activeEntry.shiftEndHour ? ` - ${activeEntry.shiftEndHour}` : ""
            }`,
          ]}
          inputs={[
            {
              type: InputTypes.SELECT,
              formKey: "selectedUsers",
              label: t("Selected Users"),
              options: users?.map((u) => ({ value: u._id, label: u.name })) ?? [],
              placeholder: t("Selected Users"),
              isMultiple: true,
              required: false,
            },
          ]}
          formKeys={[{ key: "selectedUsers", type: FormKeyTypeEnum.ARRAY }]}
          setForm={setAssignForm as any}
          submitItem={updateShift as any}
          isEditMode={true}
          constantValues={{ selectedUsers: activeEntry.users }}
          handleUpdate={() => {
            const newUsers = assignForm?.selectedUsers ?? [];
            if (activeEntry.shiftRecordId) {
              const record = shifts?.find(
                (s) => s._id === activeEntry.shiftRecordId
              );
              const updatedShifts = record?.shifts?.map((s: ShiftValue) => {
                if (
                  s.shift === activeEntry.shiftLabel &&
                  (s.shiftEndHour || "") === (activeEntry.shiftEndHour || "")
                ) {
                  return { ...s, user: newUsers };
                }
                return s;
              });
              updateShift({
                id: activeEntry.shiftRecordId,
                updates: { shifts: updatedShifts },
              });
            } else {
              const location = getItem(activeEntry.locationId, locations);
              const newShifts = location?.shifts?.map((s) => ({
                shift: s.shift,
                ...(s.shiftEndHour && { shiftEndHour: s.shiftEndHour }),
                user:
                  s.shift === activeEntry.shiftLabel &&
                  (s.shiftEndHour || "") === (activeEntry.shiftEndHour || "")
                    ? newUsers
                    : [],
              }));
              createShift({
                shifts: newShifts,
                location: activeEntry.locationId,
                day: activeEntry.day,
              });
            }
            setIsAssignModalOpen(false);
            setActiveEntry(null);
          }}
          topClassName="flex flex-col gap-2"
        />
      )}
    </div>
  );
}
