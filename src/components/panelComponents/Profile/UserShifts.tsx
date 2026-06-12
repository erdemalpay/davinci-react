import { endOfMonth, format, startOfMonth } from "date-fns";
import { useState } from "react";
import { useGetStoreLocations } from "../../../utils/api/location";
import { useGetUserShifts } from "../../../utils/api/shift";
import { useGetUser } from "../../../utils/api/user";
import { MonthlyBody, MonthlyDay } from "../../calendar/MonthlyBody";
import { MonthlyCalendar, MonthlyNav } from "../../calendar/MonthlyCalendar";

type ShiftEvent = {
  date: string;
  locationName: string;
  shiftStart: string;
  shiftEnd?: string;
};

const ShiftEventItem = ({ event }: { event: ShiftEvent }) => (
  <li className="py-1">
    <div className="flex text-sm flex-1 justify-between gap-1">
      <span className="font-medium bg-blue-300 px-2 py-[1.4px] text-white rounded-lg truncate">
        {event.locationName}
      </span>
      <span className="text-gray-500 shrink-0">
        {event.shiftStart}
        {event.shiftEnd ? ` - ${event.shiftEnd}` : ""}
      </span>
    </div>
  </li>
);

const UserShifts = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(new Date())
  );
  const user = useGetUser();
  const locations = useGetStoreLocations();

  const shifts = useGetUserShifts(
    format(startOfMonth(currentMonth), "yyyy-MM-dd"),
    format(endOfMonth(currentMonth), "yyyy-MM-dd"),
    user?._id
  );

  const events: ShiftEvent[] = (shifts || []).flatMap((shift) =>
    (shift.shifts || [])
      .filter((sv) => user?._id && sv.user.includes(user._id))
      .map((sv) => ({
        date: shift.day,
        locationName:
          locations?.find((l) => l._id === shift.location)?.name ?? "",
        shiftStart: sv.shift,
        shiftEnd: sv.shiftEndHour,
      }))
  );

  return (
    <div className="__className_a182b8 w-[95%] my-5 mx-auto">
      <MonthlyCalendar
        currentMonth={currentMonth}
        onCurrentMonthChange={(date) => setCurrentMonth(date)}
      >
        <MonthlyNav />
        <MonthlyBody<ShiftEvent> events={events}>
          <MonthlyDay<ShiftEvent>
            renderDay={(data) =>
              data.map((event, index) => (
                <ShiftEventItem key={index} event={event} />
              ))
            }
          />
        </MonthlyBody>
      </MonthlyCalendar>
    </div>
  );
};

export default UserShifts;
