import { Tooltip } from "@material-tailwind/react";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { QuickDateRangeFilter } from "../components/common/QuickDateRangeFilter";
import { Header } from "../components/header/Header";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { RoleEnum, User } from "../types";
import { dateRanges } from "../utils/api/dateRanges";
import { useGetStoreLocations } from "../utils/api/location";
import { useGetUserShifts } from "../utils/api/shift";
import { useGetStaffDailyCounts } from "../utils/api/staffPerformance";
import { useGetUsers } from "../utils/api/user";
import { useGetFilteredVisits } from "../utils/api/visit";
import {
  AttendanceDay,
  DayBreakdown,
  DayFilters,
  DayKind,
  PerformanceTone,
  StaffCountField,
  StaffDailyCounts,
  getAttendanceDays,
  getPerformanceTone,
  getStaffPerformance,
  isDayCounted,
  mean,
} from "../utils/staffPerformance";

type Column = {
  label: string;
  value: (row: PerformanceRow) => number;
  // Per day, compared with the group's average; otherwise a plain total.
  isDailyAverage: boolean;
};

type PerformanceRow = {
  user: User;
  // Shown after the name, e.g. a game master in the service staff table.
  note?: string;
  days: DayBreakdown;
  dayDates: Record<DayKind, string[]>;
  dayCount: number;
  averages: Record<StaffCountField, number>;
  learnedGameCount: number;
};

// Who is in a group, and which of their days belong to it.
type GroupMembers = {
  roles: RoleEnum[];
  isEligible?: (day: AttendanceDay) => boolean;
  // Middleman and service staff days count only when included.
  usesDayFilters?: boolean;
  note?: string;
};

type Group = {
  title: string;
  members: GroupMembers[];
  dayColumns: (keyof DayBreakdown)[];
  columns: Column[];
};

const EVERY_DAY = () => true;

const dayColumnLabels: Record<keyof DayBreakdown, string> = {
  full: "Full days",
  partTime: "Part-time days",
  unplanned: "Unplanned days",
  serviceStaff: "Service staff days",
  middleman: "Middleman days",
  marked: "Marked days",
};

// Shown only when someone has such a day.
const OPTIONAL_DAY_COLUMNS: (keyof DayBreakdown)[] = ["unplanned", "marked"];

const toneClasses: Record<PerformanceTone, string> = {
  best: "bg-green-600 text-white",
  good: "bg-green-200",
  normal: "",
  low: "bg-red-200",
  worst: "bg-red-500 text-white",
};

const formatNumber = (value: number) =>
  value.toLocaleString("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

// "yyyy-MM-dd" as "dd.MM.yyyy".
const formatDayDate = (date: string) =>
  format(new Date(`${date}T00:00:00`), "dd.MM.yyyy");

const formatDays = (value: number) =>
  value.toLocaleString("tr-TR", { maximumFractionDigits: 2 });

// Daily averages per person, to compare staff of the same role: game
// masters, service staff and baristas each against their own group.
export default function StaffPerformance() {
  const { t } = useTranslation();
  const users = useGetUsers();
  const locations = useGetStoreLocations();
  const [range, setRange] = useState(() => {
    const { after, before } = dateRanges.thisMonth();
    return { after, before };
  });
  const [location, setLocation] = useState<number | undefined>();
  const [dayFilters, setDayFilters] = useState<DayFilters>({
    includeMiddlemanDays: false,
    includeServiceStaffDays: false,
    includeMarkedDays: false,
  });

  const visits = useGetFilteredVisits(range.after, range.before);
  const shifts = useGetUserShifts(range.after, range.before);
  const dailyCounts = useGetStaffDailyCounts(
    range.after,
    range.before,
    location
  );

  const average = (field: StaffCountField) => (row: PerformanceRow) =>
    row.averages[field];
  const groups: Group[] = [
    {
      title: t("Game Masters"),
      // Middleman and service staff days can be left out; game managers'
      // days outside operation never count.
      members: [
        { roles: [RoleEnum.GAMEMASTER], usesDayFilters: true },
        {
          roles: [RoleEnum.GAMEMANAGER],
          isEligible: (day) => !day.isOutsideOperation,
          usesDayFilters: true,
        },
      ],
      dayColumns: [
        "full",
        "partTime",
        "unplanned",
        "serviceStaff",
        "middleman",
        "marked",
      ],
      columns: [
        {
          label: t("Orders Created"),
          value: average("ordersCreated"),
          isDailyAverage: true,
        },
        {
          label: t("Orders Delivered"),
          value: average("ordersDelivered"),
          isDailyAverage: true,
        },
        {
          label: t("Games Set Up"),
          value: average("gameplaysCreated"),
          isDailyAverage: true,
        },
        {
          label: t("Games Explained"),
          value: average("gameplaysMentored"),
          isDailyAverage: true,
        },
        {
          label: t("Collections"),
          value: average("collections"),
          isDailyAverage: true,
        },
        {
          label: t("Learned Games"),
          value: (row) => row.learnedGameCount,
          isDailyAverage: false,
        },
      ],
    },
    {
      title: t("Service Staff"),
      // Game masters on the days they were service staff, to compare that
      // work with the service staff's.
      members: [
        { roles: [RoleEnum.SERVICE] },
        {
          roles: [RoleEnum.GAMEMASTER, RoleEnum.GAMEMANAGER],
          isEligible: (day) => day.isServiceStaff && !day.isOutsideOperation,
          note: "GM",
        },
      ],
      dayColumns: ["full", "partTime", "unplanned", "serviceStaff"],
      columns: [
        {
          label: t("Orders Created"),
          value: average("ordersCreated"),
          isDailyAverage: true,
        },
        {
          label: t("Orders Delivered"),
          value: average("ordersDelivered"),
          isDailyAverage: true,
        },
        {
          label: t("Collections"),
          value: average("collections"),
          isDailyAverage: true,
        },
      ],
    },
    {
      title: t("Baristas"),
      // Bar chefs' days outside operation don't count.
      members: [
        { roles: [RoleEnum.BARISTA] },
        {
          roles: [RoleEnum.BARCHEF],
          isEligible: (day) => !day.isOutsideOperation,
        },
      ],
      dayColumns: ["full", "partTime", "unplanned"],
      columns: [
        {
          label: t("Orders Created"),
          value: average("ordersCreated"),
          isDailyAverage: true,
        },
        {
          label: t("Orders Prepared"),
          value: average("ordersPrepared"),
          isDailyAverage: true,
        },
        {
          label: t("Orders Delivered"),
          value: average("ordersDelivered"),
          isDailyAverage: true,
        },
        {
          label: t("Collections"),
          value: average("collections"),
          isDailyAverage: true,
        },
      ],
    },
  ];

  const countsByUser = useMemo(() => {
    const byUser = new Map<string, StaffDailyCounts[]>();
    for (const counts of dailyCounts) {
      byUser.set(counts.user, [...(byUser.get(counts.user) ?? []), counts]);
    }
    return byUser;
  }, [dailyCounts]);

  const rowsFor = (group: Group): PerformanceRow[] =>
    group.members
      .flatMap(({ roles, isEligible = EVERY_DAY, usesDayFilters, note }) =>
        users
          .filter((user) => roles.includes(user.role?._id))
          .map((user) => {
            const days = getAttendanceDays({
              userId: user._id,
              visits,
              shifts,
              locations,
              location,
            }).filter(isEligible);
            const performance = getStaffPerformance(
              days,
              countsByUser.get(user._id) ?? [],
              usesDayFilters
                ? (day) => isDayCounted(day, dayFilters)
                : EVERY_DAY
            );
            const learnedGameCount = (user.userGames ?? []).filter(
              (userGame) =>
                userGame.learnDate >= range.after &&
                userGame.learnDate <= range.before
            ).length;
            return { user, note, ...performance, learnedGameCount };
          })
      )
      .filter((row) => Object.values(row.days).some((count) => count > 0))
      .sort((a, b) => a.user.name.localeCompare(b.user.name, "tr"));

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[98%] mx-auto my-6 flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <h1 className="text-xl font-semibold">{t("Staff Performance")}</h1>
          <div className="flex flex-wrap items-center gap-4">
            <select
              className="border rounded px-2 py-1 text-sm"
              value={location ?? ""}
              onChange={(event) =>
                setLocation(
                  event.target.value ? Number(event.target.value) : undefined
                )
              }
            >
              <option value="">{t("All Locations")}</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>
                  {loc.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <SwitchButton
                checked={dayFilters.includeMiddlemanDays}
                onChange={(checked) =>
                  setDayFilters({
                    ...dayFilters,
                    includeMiddlemanDays: checked,
                  })
                }
              />
              {t("Include middleman days")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <SwitchButton
                checked={dayFilters.includeServiceStaffDays}
                onChange={(checked) =>
                  setDayFilters({
                    ...dayFilters,
                    includeServiceStaffDays: checked,
                  })
                }
              />
              {t("Include service staff days")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <SwitchButton
                checked={dayFilters.includeMarkedDays}
                onChange={(checked) =>
                  setDayFilters({
                    ...dayFilters,
                    includeMarkedDays: checked,
                  })
                }
              />
              {t("Include other marked days")}
            </label>
            <QuickDateRangeFilter
              startDate={range.after}
              endDate={range.before}
              onChange={(after: string, before: string) => {
                if (!after || !before) {
                  const thisMonth = dateRanges.thisMonth();
                  setRange({
                    after: thisMonth.after,
                    before: thisMonth.before,
                  });
                  return;
                }
                setRange({ after, before });
              }}
            />
          </div>
        </div>
        {groups.map((group) => (
          <PerformanceTable
            key={group.title}
            title={group.title}
            dayColumns={group.dayColumns}
            columns={group.columns}
            rows={rowsFor(group)}
          />
        ))}
        <p className="text-xs text-gray-500">
          {t(
            "Counted days: a full day counts as 1, a part-time day as 0.75; days missing from the shift plan count as full days. Middleman, service staff and other marked days count only when included. Hover over a day count to see its dates. Colors compare with the group's average (15% and 30% above or below)."
          )}
        </p>
      </div>
    </>
  );
}

function PerformanceTable({
  title,
  dayColumns,
  columns,
  rows,
}: {
  title: string;
  dayColumns: (keyof DayBreakdown)[];
  columns: Column[];
  rows: PerformanceRow[];
}) {
  const { t } = useTranslation();
  const shownDayColumns = dayColumns.filter(
    (key) =>
      !OPTIONAL_DAY_COLUMNS.includes(key) || rows.some((row) => row.days[key])
  );
  // Someone with no day that counts (e.g. only middleman days, left out)
  // has no averages and stays out of the group's.
  const ratedRows = rows.filter((row) => row.dayCount > 0);
  const columnAverages = columns.map((column) =>
    mean(ratedRows.map((row) => column.value(row)))
  );

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 bg-white text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">
                {t("Person")}
              </th>
              {shownDayColumns.map((key) => (
                <th
                  key={key}
                  className="border border-gray-300 px-3 py-2 text-center"
                >
                  {t(dayColumnLabels[key])}
                </th>
              ))}
              <th className="border border-gray-300 px-3 py-2 text-center">
                {t("Counted days")}
              </th>
              {columns.map((column) => (
                <th
                  key={column.label}
                  className="border border-gray-300 px-3 py-2 text-center"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={shownDayColumns.length + columns.length + 2}
                  className="px-3 py-4 text-center text-gray-500"
                >
                  {t("No data")}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.user._id}>
                <td className="border border-gray-300 px-3 py-2">
                  {row.user.name}
                  {row.note && (
                    <span className="ml-1 text-xs text-gray-500">
                      ({row.note})
                    </span>
                  )}
                </td>
                {shownDayColumns.map((key) => (
                  <td
                    key={key}
                    className="border border-gray-300 px-3 py-2 text-center"
                  >
                    {row.days[key] > 0 ? (
                      <Tooltip
                        content={
                          <div className="flex flex-col">
                            {row.dayDates[key].map((date) => (
                              <span key={date}>{formatDayDate(date)}</span>
                            ))}
                          </div>
                        }
                        placement="top"
                      >
                        <span className="cursor-default underline decoration-dotted">
                          {row.days[key]}
                        </span>
                      </Tooltip>
                    ) : (
                      row.days[key]
                    )}
                  </td>
                ))}
                <td className="border border-gray-300 px-3 py-2 text-center font-semibold">
                  {formatDays(row.dayCount)}
                </td>
                {columns.map((column, index) => {
                  const value = column.value(row);
                  const isRated = !column.isDailyAverage || row.dayCount > 0;
                  const tone =
                    column.isDailyAverage && isRated
                      ? getPerformanceTone(value, columnAverages[index])
                      : "normal";
                  return (
                    <td
                      key={column.label}
                      className={`border border-gray-300 px-3 py-2 text-center ${toneClasses[tone]}`}
                    >
                      {!isRated
                        ? "–"
                        : column.isDailyAverage
                        ? formatNumber(value)
                        : value}
                    </td>
                  );
                })}
              </tr>
            ))}
            {rows.length > 0 && (
              <tr className="font-bold bg-gray-50">
                <td className="border border-gray-300 px-3 py-2">
                  {t("Overall Average")}
                </td>
                {shownDayColumns.map((key) => (
                  <td key={key} className="border border-gray-300" />
                ))}
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {formatDays(mean(ratedRows.map((row) => row.dayCount)))}
                </td>
                {columnAverages.map((value, index) => (
                  <td
                    key={columns[index].label}
                    className="border border-gray-300 px-3 py-2 text-center"
                  >
                    {formatNumber(value)}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
