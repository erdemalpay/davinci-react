import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import HourInput from "./HourInput";

type DailyHour = {
  day: string;
  openingTime?: string;
  closingTime?: string;
  isClosed?: boolean;
};

type DailyHoursInputProps = {
  value?: DailyHour[];
  onChange: (value: DailyHour[]) => void;
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DailyHoursInput = ({ value, onChange }: DailyHoursInputProps) => {
  const { t } = useTranslation();

  const [dailyHours, setDailyHours] = useState<DailyHour[]>(() => {
    if (value && value.length > 0) return value;
    return DAYS.map((day) => ({
      day,
      openingTime: "09:00",
      closingTime: "18:00",
      isClosed: false,
    }));
  });

  useEffect(() => {
    onChange(dailyHours);
  }, [dailyHours]);

  const handleTimeChange = (
    day: string,
    field: "openingTime" | "closingTime",
    newValue: string
  ) => {
    setDailyHours((prev) =>
      prev.map((dh) => (dh.day === day ? { ...dh, [field]: newValue } : dh))
    );
  };

  const handleClosedToggle = (day: string) => {
    setDailyHours((prev) =>
      prev.map((dh) =>
        dh.day === day ? { ...dh, isClosed: !dh.isClosed } : dh
      )
    );
  };

  return (
    <div className="flex flex-col gap-3 w-full ">
      <label className="text-sm font-medium">{t("Daily Opening Hours")}</label>
      <div className="flex flex-col gap-2 border rounded-md p-3">
        {dailyHours.map((dayHour) => (
          <div
            key={dayHour.day}
            className="flex flex-col sm:grid sm:grid-cols-[70px_90px_1fr] gap-2 sm:items-center pb-2 border-b last:border-b-0"
          >
            <div className="font-medium text-sm sm:text-xs truncate">{t(dayHour.day)}</div>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={dayHour.isClosed}
                onChange={() => handleClosedToggle(dayHour.day)}
                className="w-4 h-4 sm:w-3.5 sm:h-3.5"
              />
              <span className="text-sm sm:text-xs">{t("Closed")}</span>
            </label>

            {!dayHour.isClosed && (
              <div className="flex items-center gap-2 sm:gap-1.5 min-w-0">
                <div className="flex-1 min-w-0">
                  <HourInput
                    value={dayHour.openingTime}
                    onChange={(val) =>
                      handleTimeChange(dayHour.day, "openingTime", val)
                    }
                  />
                </div>
                <span className="text-sm sm:text-xs">-</span>
                <div className="flex-1 min-w-0">
                  <HourInput
                    value={dayHour.closingTime}
                    onChange={(val) =>
                      handleTimeChange(dayHour.day, "closingTime", val)
                    }
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyHoursInput;
