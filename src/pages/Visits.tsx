import { format, startOfMonth } from "date-fns";

import { useState } from "react";
import { MonthlyBody, MonthlyDay } from "../components/calendar/MonthlyBody";
import {
  MonthlyCalendar,
  MonthlyNav,
} from "../components/calendar/MonthlyCalendar";
import { VisitEventItem } from "../components/calendar/MonthlyEventItems";
import { Header } from "../components/header/Header";
import { Visit } from "../types";
import { useGetMonthlyVisits } from "../utils/api/visit";

export default function Visits() {
  let [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(new Date())
  );

  let [location, setLocation] = useState<number>(1);

  const { visits } = useGetMonthlyVisits(
    location,
    format(currentMonth, "yyyy-MM")
  );

  return (
    <>
      <Header showLocationSelector={false} />

      <div className="mx-[20px]">
        <div className="flex justıfy-end">
          <div className="mt-4 flex justify-between w-full">
            <h1 className="text-4xl">
              {location === 1 ? "Bahçeli" : "Neorama"}
            </h1>
            <div className="flex justify-end w-full">
              <button
                onClick={() => setLocation(1)}
                className={`relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-500 to-pink-500 ${
                  location === 1 ? "ring-2 outline-none ring-red-800" : ""
                }`}
              >
                <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md">
                  Bahçeli
                </span>
              </button>
              <button
                onClick={() => setLocation(2)}
                className={`relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-500 to-red-500 ${
                  location === 2 ? "ring-2 outline-none ring-red-800" : ""
                }`}
              >
                <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md">
                  Neorama
                </span>
              </button>
            </div>
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
                data.map((visit) => (
                  <VisitEventItem key={visit._id} visit={visit} />
                ))
              }
            />
          </MonthlyBody>
        </MonthlyCalendar>
      </div>
    </>
  );
}
