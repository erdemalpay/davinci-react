import { addDays, format, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type Props = {
  date: string;
  onChange: (date: string) => void;
};

const shift = (date: string, days: number) =>
  format(addDays(parseISO(date), days), "yyyy-MM-dd");

// A day, with buttons for the day before and after.
export function DayPicker({ date, onChange }: Props) {
  const { t } = useTranslation();
  const today = format(new Date(), "yyyy-MM-dd");
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label={t("Previous day")}
        className="p-2 rounded border border-gray-300 bg-white hover:bg-gray-50"
        onClick={() => onChange(shift(date, -1))}
      >
        <FiChevronLeft />
      </button>
      <input
        type="date"
        value={date}
        max={today}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="px-2 py-1.5 rounded border border-gray-300 text-sm"
      />
      <button
        type="button"
        aria-label={t("Next day")}
        disabled={date >= today}
        className="p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40"
        onClick={() => onChange(shift(date, 1))}
      >
        <FiChevronRight />
      </button>
    </div>
  );
}
