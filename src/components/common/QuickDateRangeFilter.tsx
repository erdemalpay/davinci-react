import {
  Popover,
  PopoverContent,
  PopoverHandler,
} from "@material-tailwind/react";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { useTranslation } from "react-i18next";
import { IoCloseOutline } from "react-icons/io5";
import { LuCalendar } from "react-icons/lu";
import { DateRangeFilterType } from "../panelComponents/shared/types";

export function QuickDateRangeFilter({
  startDate,
  endDate,
  onChange,
}: DateRangeFilterType) {
  const { t } = useTranslation();

  const fromDate = startDate ? parseISO(startDate) : undefined;
  const toDate = endDate ? parseISO(endDate) : undefined;
  const selected: DateRange = { from: fromDate, to: toDate };

  const handleSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      onChange("", "");
      return;
    }
    onChange(
      format(range.from, "yyyy-MM-dd"),
      range.to ? format(range.to, "yyyy-MM-dd") : ""
    );
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("", "");
  };

  return (
    <Popover placement="bottom-start">
      <PopoverHandler>
        <button
          type="button"
          className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm hover:border-blue-400 transition-colors cursor-pointer"
        >
          <LuCalendar className="text-gray-400 text-sm flex-shrink-0" />
          <span
            className={`text-sm whitespace-nowrap ${
              fromDate ? "text-gray-800 font-medium" : "text-gray-400"
            }`}
          >
            {fromDate
              ? format(fromDate, "dd/MM/yyyy")
              : t("Start Date")}
          </span>
          <span className="text-gray-300 text-xs select-none">→</span>
          <span
            className={`text-sm whitespace-nowrap ${
              toDate ? "text-gray-800 font-medium" : "text-gray-400"
            }`}
          >
            {toDate
              ? format(toDate, "dd/MM/yyyy")
              : t("End Date")}
          </span>
          {(fromDate || toDate) && (
            <IoCloseOutline
              className="text-black hover:text-red-500 text-base flex-shrink-0 ml-1 transition-colors"
              onClick={handleClear}
            />
          )}
        </button>
      </PopoverHandler>
      <PopoverContent
        className="p-3 z-[9999]"
        style={
          {
            "--rdp-accent-color": "#3b82f6",
            "--rdp-accent-background-color": "#eff6ff",
          } as React.CSSProperties
        }
      >
        <DayPicker
          mode="range"
          selected={selected}
          onSelect={handleSelect}
          locale={tr}
          captionLayout="dropdown"
          startMonth={new Date(2020, 0)}
          endMonth={new Date(new Date().getFullYear() + 1, 11)}
        />
      </PopoverContent>
    </Popover>
  );
}
