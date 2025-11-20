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

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DailyHoursInput = ({ value, onChange }: DailyHoursInputProps) => {
  const { t } = useTranslation();

  const [dailyHours, setDailyHours] = useState<DailyHour[]>(() => {
    if (value && value.length > 0) return value;
    return DAYS.map(day => ({
      day,
      openingTime: "09:00",
      closingTime: "18:00",
      isClosed: false,
    }));
  });

  useEffect(() => {
    onChange(dailyHours);
  }, [dailyHours]);

  const handleTimeChange = (day: string, field: "openingTime" | "closingTime", newValue: string) => {
    setDailyHours(prev =>
      prev.map(dh =>
        dh.day === day ? { ...dh, [field]: newValue } : dh
      )
    );
  };

  const handleClosedToggle = (day: string) => {
    setDailyHours(prev =>
      prev.map(dh =>
        dh.day === day ? { ...dh, isClosed: !dh.isClosed } : dh
      )
    );
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <label className="text-sm font-medium">{t("Daily Opening Hours")}</label>
      <div className="flex flex-col gap-2 border rounded-md p-3">
        {dailyHours.map((dayHour) => (
          <div key={dayHour.day} className="flex items-center gap-3 pb-2 border-b last:border-b-0">
            <div className="min-w-28 font-medium text-sm">{t(dayHour.day)}</div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dayHour.isClosed}
                onChange={() => handleClosedToggle(dayHour.day)}
                className="w-4 h-4"
              />
              <span className="text-sm">{t("Closed")}</span>
            </label>

            {!dayHour.isClosed && (
              <div className="flex items-center gap-2 flex-1">
                <HourInput
                  value={dayHour.openingTime}
                  onChange={(val) => handleTimeChange(dayHour.day, "openingTime", val)}
                />
                <span className="text-sm">-</span>
                <HourInput
                  value={dayHour.closingTime}
                  onChange={(val) => handleTimeChange(dayHour.day, "closingTime", val)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyHoursInput;
