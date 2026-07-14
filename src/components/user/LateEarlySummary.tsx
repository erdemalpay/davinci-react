import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Shift, Visit } from "../../types";
import { formatAsLocalDate } from "../../utils/format";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { RowKeyType } from "../panelComponents/shared/types";

type LateEarlyRow = {
  date: string;
  formattedDate: string;
  plannedStart: string;
  actualStart: string;
  lateMinutes: number | null;
  plannedEnd: string;
  actualFinish: string;
  earlyMinutes: number | null;
  hasNoCheckout?: boolean;
  className?: string;
  isSortable?: boolean;
  isTotal?: boolean;
};

type Props = {
  visits: Visit[];
  shifts: Shift[];
  userId: string;
};

const toMinutes = (hour?: string) => {
  if (!hour) return null;
  const [h, m] = hour.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

const computeLateEarlyRows = (
  visits: Visit[],
  shifts: Shift[],
  userId: string
): LateEarlyRow[] => {
  // Group visits by date+location; earliest start is the arrival, latest finish is the departure
  const visitsByDay = new Map<string, Visit[]>();
  visits?.forEach((visit) => {
    const key = `${visit.date}__${visit.location}`;
    visitsByDay.set(key, [...(visitsByDay.get(key) ?? []), visit]);
  });
  const rows: LateEarlyRow[] = [];
  visitsByDay.forEach((dayVisits, key) => {
    const [date, location] = key.split("__");
    const userShift = shifts
      ?.find(
        (shift) => shift.day === date && shift.location === Number(location)
      )
      ?.shifts?.find((s) => s.user?.includes(userId));
    if (!userShift || userShift.notInAverage) return;
    const plannedStart = toMinutes(userShift.shift);
    if (plannedStart === null) return;
    const sortedByStart = [...dayVisits].sort((a, b) =>
      a.startHour.localeCompare(b.startHour)
    );
    const firstVisit = sortedByStart[0];
    const actualStart = toMinutes(firstVisit.startHour);
    if (actualStart === null) return;
    const lateMinutes = actualStart - plannedStart;

    // shiftEndHour and finishHour may pass midnight; normalize against the start hours
    let plannedEnd = toMinutes(userShift.shiftEndHour);
    if (plannedEnd !== null && plannedEnd < plannedStart) plannedEnd += 1440;
    const finishVisits = dayVisits
      .map((visit) => {
        let finish = toMinutes(visit.finishHour);
        const start = toMinutes(visit.startHour);
        if (finish !== null && start !== null && finish < start) finish += 1440;
        return { visit, finish };
      })
      .filter(
        (item): item is { visit: Visit; finish: number } => item.finish !== null
      );
    const lastFinishVisit = finishVisits.length
      ? finishVisits.reduce((max, item) =>
          item.finish > max.finish ? item : max
        )
      : null;
    const actualFinish = lastFinishVisit?.finish ?? null;
    const earlyMinutes =
      plannedEnd !== null && actualFinish !== null
        ? plannedEnd - actualFinish
        : null;

    if (lateMinutes > 0 || (earlyMinutes !== null && earlyMinutes > 0)) {
      rows.push({
        date,
        formattedDate: formatAsLocalDate(date),
        plannedStart: userShift.shift,
        actualStart: firstVisit.startHour,
        lateMinutes: lateMinutes > 0 ? lateMinutes : null,
        plannedEnd: userShift.shiftEndHour ?? "-",
        actualFinish: lastFinishVisit?.visit.finishHour ?? "",
        hasNoCheckout: actualFinish === null,
        earlyMinutes:
          earlyMinutes !== null && earlyMinutes > 0 ? earlyMinutes : null,
      });
    }
  });
  return rows.sort((a, b) => b.date.localeCompare(a.date));
};

const LateEarlySummary = ({ visits, shifts, userId }: Props) => {
  const { t } = useTranslation();
  const rows = useMemo(
    () => computeLateEarlyRows(visits, shifts, userId),
    [visits, shifts, userId]
  );
  const { lateRows, earlyRows, allRows } = useMemo(() => {
    const lateRows = rows.filter((row) => row.lateMinutes !== null);
    const earlyRows = rows.filter((row) => row.earlyMinutes !== null);
    const totalLateMinutes = lateRows.reduce(
      (acc, row) => acc + (row.lateMinutes ?? 0),
      0
    );
    const totalEarlyMinutes = earlyRows.reduce(
      (acc, row) => acc + (row.earlyMinutes ?? 0),
      0
    );
    const allRows: LateEarlyRow[] = [...rows];
    if (rows.length > 0) {
      allRows.unshift({
        date: t("Total"),
        formattedDate: t("Total"),
        plannedStart: "",
        actualStart: "",
        lateMinutes: totalLateMinutes > 0 ? totalLateMinutes : null,
        plannedEnd: "",
        actualFinish: "",
        earlyMinutes: totalEarlyMinutes > 0 ? totalEarlyMinutes : null,
        className: "font-semibold",
        isSortable: false,
        isTotal: true,
      });
    }
    return { lateRows, earlyRows, allRows };
  }, [rows, t]);
  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: true },
      { key: t("Planned Start"), isSortable: true },
      { key: t("Actual Start"), isSortable: true },
      { key: t("Minutes Late"), isSortable: true },
      { key: t("Planned End"), isSortable: true },
      { key: t("Actual Finish"), isSortable: true },
      { key: t("Minutes Early"), isSortable: true },
    ],
    [t]
  );
  const rowKeys = useMemo<RowKeyType<LateEarlyRow>[]>(
    () => [
      {
        key: "date",
        className: "min-w-32 pr-2",
        node: (row: LateEarlyRow) => (
          <p className={`${row?.className ?? ""}`}>{row.formattedDate}</p>
        ),
      },
      { key: "plannedStart" },
      { key: "actualStart" },
      {
        key: "lateMinutes",
        node: (row: LateEarlyRow) =>
          row.lateMinutes !== null ? (
            <p className="text-red-500 font-semibold">
              {row.lateMinutes} {t("minutes")}
              {row.isTotal ? ` (${lateRows.length} ${t("days")})` : ""}
            </p>
          ) : (
            <p>{row.isTotal ? "" : "-"}</p>
          ),
      },
      { key: "plannedEnd" },
      {
        key: "actualFinish",
        node: (row: LateEarlyRow) =>
          row.hasNoCheckout ? (
            <p className="text-gray-400 italic">{t("No Check-out")}</p>
          ) : (
            <p>{row.actualFinish}</p>
          ),
      },
      {
        key: "earlyMinutes",
        node: (row: LateEarlyRow) =>
          row.earlyMinutes !== null ? (
            <p className="text-orange-500 font-semibold">
              {row.earlyMinutes} {t("minutes")}
              {row.isTotal ? ` (${earlyRows.length} ${t("days")})` : ""}
            </p>
          ) : (
            <p>{row.isTotal ? "" : "-"}</p>
          ),
      },
    ],
    [t, lateRows.length, earlyRows.length]
  );
  return (
    <div className="w-full border p-2 rounded-lg border-gray-200 bg-white">
      <GenericTable
        columns={columns}
        rows={allRows}
        rowKeys={rowKeys}
        title={t("Late Arrivals & Early Departures")}
        isActionsActive={false}
      />
    </div>
  );
};

export default LateEarlySummary;
