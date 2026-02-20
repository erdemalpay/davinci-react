import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverHandler,
} from "@material-tailwind/react";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { useTranslation } from "react-i18next";
import { IoCalendarOutline } from "react-icons/io5";

interface Props {
  date: Date;
  setDate: (date: string) => void;
  onMonthChange?: (month: Date) => void;
  openTableDates?: string[];
  compact?: boolean;
}

export function DateInput({
  date,
  setDate,
  onMonthChange,
  openTableDates,
  compact = false,
}: Props) {
  const { t } = useTranslation();

  const [month, setMonth] = useState<Date>(date);

  const handleToday = () => {
    const today = new Date();
    setDate(format(today, "yyyy-MM-dd"));
    setMonth(today);
  };

  const handleMonthChange = (newMonth: Date) => {
    setMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const openDateObjects = openTableDates
    ? openTableDates.map((d) => parseISO(d))
    : [];

  return (
    <div className={compact ? "" : "p-2"}>
      <Popover placement={compact ? "bottom-end" : "bottom"}>
        <PopoverHandler>
          {compact ? (
            <div className="flex items-center gap-1 cursor-pointer hover:scale-110 transition-transform duration-200">
              <IoCalendarOutline className="text-2xl text-white" />
              <span className="text-white text-xs font-medium">
                {format(date, "dd/MM")}
              </span>
            </div>
          ) : (
            <Input
              label={t("Select a Date")}
              readOnly
              value={date ? format(date, "dd/MM/yyyy") : ""}
              onChange={() => null}
            />
          )}
        </PopoverHandler>
        <PopoverContent className={`p-2 space-y-2 ${compact ? "z-[200]" : ""}`}>
          <DayPicker
            month={month}
            onMonthChange={handleMonthChange}
            locale={tr}
            onDayClick={(day) => {
              if (day) {
                setDate(format(day, "yyyy-MM-dd"));
              }
            }}
            showOutsideDays
            captionLayout="dropdown"
            modifiers={{ selected: date, hasOpenTable: openDateObjects }}
            modifiersClassNames={{ hasOpenTable: "has-open-table" }}
          />
          <Button
            size="sm"
            color="blue"
            onClick={handleToday}
            className="w-full"
          >
            {t("Today")}
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
