import { useTranslation } from "react-i18next";
import { DateRangeKey, commonDateOptions } from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";

export type DatePresetRange = { after: string; before: string; date: string };

// Ranges looking back; future ones say nothing about what happened.
const PAST_DATE_OPTIONS = commonDateOptions.filter(
  (option) =>
    ![
      "nextWeek",
      "nextMonth",
      "fromTodayToEndOfNextMonth",
      "customDate",
    ].includes(option.value)
);

// Today, this week, last month, ... for report pages; `value` is empty for
// a range picked by hand.
export function DatePresetSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (range: DatePresetRange) => void;
}) {
  const { t } = useTranslation();
  return (
    <select
      className="border rounded px-2 py-1 text-sm"
      value={value}
      onChange={(event) => {
        const dateRange = dateRanges[event.target.value as DateRangeKey];
        if (dateRange) onChange(dateRange());
      }}
    >
      {!value && <option value="">{t("Custom Date")}</option>}
      {PAST_DATE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {t(option.label)}
        </option>
      ))}
    </select>
  );
}
