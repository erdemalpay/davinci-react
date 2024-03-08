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
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(new Date())
  );

  const [location, setLocation] = useState<number>(1);

  const { visits } = useGetMonthlyVisits(
    location,
    format(currentMonth, "yyyy-MM")
  );

  return (
    <>
      <Header showLocationSelector={false} />

      <div className=" __className_a182b8 w-[90%] mx-auto ">
        <div className="flex justıfy-end">
          <div className="my-4 flex justify-between w-full">
            <h1 className="text-4xl ">
              {location === 1 ? "Bahçeli" : "Neorama"}
            </h1>
            <div className="flex justify-end w-full">
              <button
                onClick={() => setLocation(1)}
                className={`relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg `}
              >
                <span
                  className={`relative px-5 py-2.5 transition-all ease-in duration-75   rounded-md ${
                    location === 1
                      ? "bg-red-800 text-white  "
                      : "hover:text-red-800"
                  }`}
                >
                  Bahçeli
                </span>
              </button>
              <button
                onClick={() => setLocation(2)}
                className={`relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg }`}
              >
                <span
                  className={`relative px-5 py-2.5 transition-all ease-in duration-75 rounded-md ${
                    location === 2
                      ? "bg-red-800 text-white  "
                      : "hover:text-red-800"
                  }`}
                >
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
