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
  DayFilters,
  PerformanceTone,
  StaffCountField,
  StaffDailyCounts,
  getAttendanceDays,
  getPerformanceTone,
  getStaffPerformance,
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
  dayCount: number;
  unplannedDayCount: number;
  averages: Record<StaffCountField, number>;
  learnedGameCount: number;
};

type Group = {
  title: string;
  roles: RoleEnum[];
  columns: Column[];
  // Game masters' middleman and service staff days can be left out; for
  // the others every day counts.
  usesDayFilters: boolean;
};

const ALL_DAYS: DayFilters = {
  includeMiddlemanDays: true,
  includeServiceStaffDays: true,
};

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
      roles: [RoleEnum.GAMEMASTER, RoleEnum.GAMEMANAGER],
      usesDayFilters: true,
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
      roles: [RoleEnum.SERVICE],
      usesDayFilters: false,
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
      roles: [RoleEnum.BARISTA],
      usesDayFilters: false,
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
    users
      .filter((user) => group.roles.includes(user.role?._id))
      .map((user) => {
        const days = getAttendanceDays({
          userId: user._id,
          visits,
          shifts,
          locations,
          location,
        });
        const performance = getStaffPerformance(
          days,
          countsByUser.get(user._id) ?? [],
          group.usesDayFilters ? dayFilters : ALL_DAYS
        );
        const learnedGameCount = (user.userGames ?? []).filter(
          (userGame) =>
            userGame.learnDate >= range.after &&
            userGame.learnDate <= range.before
        ).length;
        return { user, ...performance, learnedGameCount };
      })
      .filter((row) => row.dayCount > 0)
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
            columns={group.columns}
            rows={rowsFor(group)}
          />
        ))}
        <p className="text-xs text-gray-500">
          {t(
            "Daily averages: a full-time day counts as 1, a part-time day as 0.75; days missing from the shift plan count as full days. Colors compare with the group's average (15% and 30% above or below)."
          )}
        </p>
      </div>
    </>
  );
}

function PerformanceTable({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: Column[];
  rows: PerformanceRow[];
}) {
  const { t } = useTranslation();
  const columnAverages = columns.map((column) =>
    mean(rows.map((row) => column.value(row)))
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
              <th className="border border-gray-300 px-3 py-2 text-center">
                {t("Days")}
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
                  colSpan={columns.length + 2}
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
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {formatDays(row.dayCount)}
                  {row.unplannedDayCount > 0 && (
                    <span
                      className="ml-1 text-xs text-orange-600"
                      title={t("Days missing from the shift plan")}
                    >
                      ({row.unplannedDayCount} {t("unplanned")})
                    </span>
                  )}
                </td>
                {columns.map((column, index) => {
                  const value = column.value(row);
                  const tone = column.isDailyAverage
                    ? getPerformanceTone(value, columnAverages[index])
                    : "normal";
                  return (
                    <td
                      key={column.label}
                      className={`border border-gray-300 px-3 py-2 text-center ${toneClasses[tone]}`}
                    >
                      {column.isDailyAverage ? formatNumber(value) : value}
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
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {formatDays(mean(rows.map((row) => row.dayCount)))}
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
