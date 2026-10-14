import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DatePresetSelect } from "../components/common/DatePresetSelect";
import { QuickDateRangeFilter } from "../components/common/QuickDateRangeFilter";
import { Header } from "../components/header/Header";
import { useDataContext } from "../context/Data.context";
import {
  ButtonCallTypeEnum,
  DeclineReasonEnum,
  declineReasonLabels,
} from "../types";
import { useGetAssignmentEvents } from "../utils/api/buttonCall";
import { dateRanges } from "../utils/api/dateRanges";
import {
  ASSIGNED_CALL_TYPES,
  AssignedCallType,
  CallSummaryRow,
  assignedTotal,
  declineRate,
  summarizeCallsByPerson,
} from "../utils/callSummary";
import { getItem } from "../utils/getItem";

const callTypeLabels: Record<AssignedCallType, string> = {
  [ButtonCallTypeEnum.GAMEMASTERCALL]: "Game master call",
  [ButtonCallTypeEnum.ORDERCALL]: "Service call",
  [ButtonCallTypeEnum.ORDERREADYCALL]: "Order Ready Call",
};

const DECLINE_REASONS = Object.values(DeclineReasonEnum);

const formatRate = (rate: number) =>
  `%${(rate * 100).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`;

const cell = "border border-gray-300 px-3 py-2 text-center";
const headCell = "border border-gray-300 px-3 py-2 text-center bg-gray-100";

// Who was given which calls over a day or a range, how many they declined
// and why; the call assignment log has the calls one by one.
export default function CallSummary() {
  const { t } = useTranslation();
  const { users = [] } = useDataContext();
  // date: the chosen preset, empty for a range picked by hand.
  const [range, setRange] = useState(() => dateRanges.today());
  const events = useGetAssignmentEvents({
    after: range.after,
    before: range.before,
  });

  const rows = useMemo(
    () =>
      summarizeCallsByPerson(events).sort(
        (a, b) =>
          assignedTotal(b) + b.claimed - (assignedTotal(a) + a.claimed) ||
          b.declined - a.declined
      ),
    [events]
  );
  const total = useMemo(() => {
    const sum = (value: (row: CallSummaryRow) => number) =>
      rows.reduce((acc, row) => acc + value(row), 0);
    return {
      user: "",
      assigned: Object.fromEntries(
        ASSIGNED_CALL_TYPES.map((type) => [
          type,
          sum((row) => row.assigned[type]),
        ])
      ) as Record<AssignedCallType, number>,
      claimed: sum((row) => row.claimed),
      takenFrom: sum((row) => row.takenFrom),
      declined: sum((row) => row.declined),
      declinesByReason: Object.fromEntries(
        DECLINE_REASONS.map((reason) => [
          reason,
          sum((row) => row.declinesByReason[reason]),
        ])
      ) as Record<DeclineReasonEnum, number>,
    };
  }, [rows]);

  const renderRow = (row: CallSummaryRow, name: string, className = "") => (
    <tr key={row.user || "total"} className={className}>
      <td className="border border-gray-300 px-3 py-2 text-left">{name}</td>
      {ASSIGNED_CALL_TYPES.map((type) => (
        <td key={type} className={cell}>
          {row.assigned[type]}
        </td>
      ))}
      <td className={cell}>{row.claimed}</td>
      <td className={cell}>{row.takenFrom}</td>
      <td className={`${cell} font-semibold`}>{row.declined}</td>
      <td className={cell}>{formatRate(declineRate(row))}</td>
      {DECLINE_REASONS.map((reason) => (
        <td key={reason} className={cell}>
          {row.declinesByReason[reason] || ""}
        </td>
      ))}
    </tr>
  );

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[98%] mx-auto my-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <h1 className="text-xl font-semibold">{t("Call Summary")}</h1>
          <div className="flex flex-wrap items-center gap-4">
            <DatePresetSelect value={range.date} onChange={setRange} />
            <QuickDateRangeFilter
              startDate={range.after}
              endDate={range.before}
              onChange={(after: string, before: string) =>
                setRange(
                  after && before
                    ? { after, before, date: "" }
                    : dateRanges.today()
                )
              }
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 bg-white text-sm">
            <thead>
              <tr>
                <th rowSpan={2} className={`${headCell} text-left`}>
                  {t("Person")}
                </th>
                <th colSpan={ASSIGNED_CALL_TYPES.length} className={headCell}>
                  {t("Assigned calls")}
                </th>
                <th rowSpan={2} className={headCell}>
                  {t("Took over")}
                </th>
                <th rowSpan={2} className={headCell}>
                  {t("Taken over from them")}
                </th>
                <th rowSpan={2} className={headCell}>
                  {t("Declined")}
                </th>
                <th rowSpan={2} className={headCell}>
                  {t("Decline rate")}
                </th>
                <th colSpan={DECLINE_REASONS.length} className={headCell}>
                  {t("Decline reasons")}
                </th>
              </tr>
              <tr>
                {ASSIGNED_CALL_TYPES.map((type) => (
                  <th key={type} className={headCell}>
                    {t(callTypeLabels[type])}
                  </th>
                ))}
                {DECLINE_REASONS.map((reason) => (
                  <th key={reason} className={headCell}>
                    {t(declineReasonLabels[reason])}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={
                      ASSIGNED_CALL_TYPES.length + DECLINE_REASONS.length + 5
                    }
                    className="px-3 py-4 text-center text-gray-500"
                  >
                    {t("No data")}
                  </td>
                </tr>
              )}
              {rows.map((row) =>
                renderRow(row, getItem(row.user, users)?.name ?? row.user)
              )}
              {rows.length > 0 &&
                renderRow(total, t("Total"), "font-bold bg-gray-50")}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500">
          {t(
            "Decline rate: declines out of the calls assigned or taken over. The call assignment log lists the calls one by one, with the notes of the declines."
          )}
        </p>
      </div>
    </>
  );
}
