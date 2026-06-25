import { endOfMonth, format, startOfMonth } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocationContext } from "../../context/Location.context";
import { Shift } from "../../types";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetShifts } from "../../utils/api/shift";
import { useGetUsersMinimal } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import { MonthlyBody, MonthlyDay } from "../calendar/MonthlyBody";
import { MonthlyCalendar, MonthlyNav } from "../calendar/MonthlyCalendar";
import ButtonFilter from "../panelComponents/common/ButtonFilter";

type ShiftCalendarEvent = Shift & { date: string };

export default function ShiftsCalendar() {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(new Date())
  );
  const { selectedLocationId: globalLocationId } = useLocationContext();
  const [selectedLocationId, setSelectedLocationId] = useState(
    globalLocationId
  );
  const locations = useGetStoreLocations();
  const users = useGetUsersMinimal();

  const after = format(currentMonth, "yyyy-MM-dd");
  const before = format(endOfMonth(currentMonth), "yyyy-MM-dd");

  const shifts = useGetShifts(after, before, selectedLocationId);

  const events: ShiftCalendarEvent[] = (shifts || []).map((shift) => ({
    ...shift,
    date: shift.day,
  }));

  return (
    <div className="__className_a182b8 w-[95%] mx-auto">
      <div className="my-4 flex justify-end">
        <div className="flex gap-2 flex-wrap">
          <ButtonFilter
            buttonName={t("All")}
            onclick={() => setSelectedLocationId(-1)}
            backgroundColor="#6B7280"
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
      <MonthlyCalendar
        currentMonth={currentMonth}
        onCurrentMonthChange={(date) => setCurrentMonth(date)}
      >
        <MonthlyNav />
        <MonthlyBody<ShiftCalendarEvent> events={events}>
          <MonthlyDay<ShiftCalendarEvent>
            renderDay={(dayShifts) => {
              if (!dayShifts.length) return null;

              type LocationEntry = { locationId: number; users: string[] };
              type SlotEntry = {
                label: string;
                startMinutes: number;
                locationEntries: LocationEntry[];
              };
              const slotMap = new Map<string, SlotEntry>();

              dayShifts.forEach((shiftRecord) => {
                const locationId = shiftRecord.location ?? -1;
                shiftRecord.shifts?.forEach((sv) => {
                  const key = `${sv.shift}${sv.shiftEndHour ? `-${sv.shiftEndHour}` : ""}`;
                  let slot = slotMap.get(key);
                  if (!slot) {
                    const [h, m] = sv.shift.split(":").map(Number);
                    slot = { label: key, startMinutes: h * 60 + (m || 0), locationEntries: [] };
                    slotMap.set(key, slot);
                  }
                  const existing = slot.locationEntries.find(
                    (e) => e.locationId === locationId
                  );
                  if (existing) {
                    existing.users.push(...(sv.user || []));
                  } else {
                    slot.locationEntries.push({ locationId, users: sv.user || [] });
                  }
                });
              });

              const sortedSlots = Array.from(slotMap.values()).sort(
                (a, b) => a.startMinutes - b.startMinutes
              );
              const isAllMode = selectedLocationId === -1;

              return (
                <>
                  {sortedSlots.map((slot) => {
                    const hasUsers = slot.locationEntries.some(
                      (e) => e.users.length > 0
                    );
                    if (!hasUsers) return null;
                    return (
                      <li key={slot.label} className="mb-1">
                        <div className="text-xs font-semibold text-gray-500 mb-0.5">
                          {slot.label}
                        </div>
                        {slot.locationEntries.map((entry) => {
                          if (!entry.users.length) return null;
                          const location = getItem(entry.locationId, locations);
                          return (
                            <div key={entry.locationId} className="mb-0.5">
                              {isAllMode && location && (
                                <div
                                  className="text-xs font-semibold mb-0.5"
                                  style={{
                                    color:
                                      location.backgroundColor || "#6B7280",
                                  }}
                                >
                                  {location.name}
                                </div>
                              )}
                              <div className="flex flex-wrap gap-0.5">
                                {entry.users.map((userId, idx) => {
                                  const foundUser = getItem(userId, users);
                                  if (!foundUser) return null;
                                  return (
                                    <span
                                      key={`${userId}-${idx}`}
                                      className="text-xs px-1 py-0.5 rounded text-white leading-tight"
                                      style={{
                                        backgroundColor:
                                          foundUser.role?.color || "#6B7280",
                                      }}
                                    >
                                      {foundUser.name}
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
  );
}
