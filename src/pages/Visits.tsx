import { format, startOfMonth } from "date-fns";

import { useState } from "react";
import { MonthlyBody, MonthlyDay } from "../components/calendar/MonthlyBody";
import {
  MonthlyCalendar,
  MonthlyNav,
} from "../components/calendar/MonthlyCalendar";
import { VisitEventItem } from "../components/calendar/MonthlyEventItems";
import { Header } from "../components/header/Header";
import { useLocationContext } from "../context/Location.context";
import { Visit } from "../types";
import { useGetMonthlyVisits } from "../utils/api/visit";

export default function Visits() {
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(new Date())
  );
  const { selectedLocationId: location } = useLocationContext();
  const { visits } = useGetMonthlyVisits(
    location,
    format(currentMonth, "yyyy-MM")
  );
  return (
    <>
      <Header showLocationSelector={true} />
      <div className=" __className_a182b8 w-[90%] mx-auto ">
        <div className="flex justıfy-end">
          <div className="my-4 flex justify-between w-full">
            <h1 className="text-4xl ">
              {location === 1 ? "Bahçeli" : "Neorama"}
            </h1>
          </div>
        </div>
        <MonthlyCalendar
          currentMonth={currentMonth}
          onCurrentMonthChange={(date) => setCurrentMonth(date)}
        >
          <MonthlyNav />
          <MonthlyBody<Visit> events={visits || []}>
            <MonthlyDay<Visit>
              renderDay={(data) =>
                data.map((visit, index) => (
                  <VisitEventItem key={visit._id} visit={visit} index={index} />
                ))
              }
            />
          </MonthlyBody>
        </MonthlyCalendar>
      </div>
    </>
  );
}
