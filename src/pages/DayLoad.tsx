import { format } from "date-fns";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import SelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import { DayPicker } from "../components/timeline/DayPicker";
import { StatCard } from "../components/timeline/StatCard";
import {
  defaultLocationId,
  formatDuration,
} from "../components/timeline/timelineDisplay";
import { LoadPoint, useGetDayLoad } from "../utils/api/timeline";
import { useGetStoreLocations } from "../utils/api/location";

const STEP_SECONDS = 5 * 60;

type Series = { key: keyof LoadPoint; label: string; color: string };

const callSeries: Series[] = [
  { key: "gmCalls", label: "Game master call", color: "#2563eb" },
  { key: "serviceCalls", label: "Service call", color: "#f97316" },
  { key: "orderReadyCalls", label: "Order Ready Call", color: "#ec4899" },
];

const staffSeries: Series[] = [
  { key: "freeStaff", label: "Idle", color: "#22c55e" },
  { key: "call", label: "On a call", color: "#2563eb" },
  { key: "explaining", label: "Explaining", color: "#8b5cf6" },
  { key: "middleman", label: "Middleman", color: "#14b8a6" },
  { key: "otherBusy", label: "Busy", color: "#facc15" },
  { key: "break", label: "On break", color: "#f59e0b" },
];

function ChartCard({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactElement;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-2">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {note && <p className="text-xs text-gray-500">{note}</p>}
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// How busy the cafe was through a day: calls, free staff, tables and
// orders every 5 minutes. For managers.
export default function DayLoad() {
  const { t } = useTranslation();
  const locations = useGetStoreLocations() ?? [];
  const [params, setParams] = useSearchParams();
  const date = params.get("date") ?? format(new Date(), "yyyy-MM-dd");
  const location =
    Number(params.get("location")) || defaultLocationId(locations);
  const points = useGetDayLoad(location, date);

  const update = (changes: Record<string, string>) =>
    setParams({ date, location: String(location), ...changes });

  const locationOptions = locations.map((l) => ({
    value: String(l._id),
    label: l.name,
  }));

  const stats = useMemo(() => {
    if (points.length === 0) return null;
    const openCalls = (p: LoadPoint) =>
      p.gmCalls + p.serviceCalls + p.orderReadyCalls;
    const peakCalls = points.reduce((a, b) =>
      openCalls(b) > openCalls(a) ? b : a
    );
    const peakCustomers = points.reduce((a, b) =>
      b.customers > a.customers ? b : a
    );
    const waitingWithNoneFree = points.filter(
      (p) => p.waitingCalls > 0 && p.freeStaff === 0
    ).length;
    const waiting = points.filter((p) => p.waitingCalls > 0).length;
    return {
      peakCalls,
      peakCallCount: openCalls(peakCalls),
      peakCustomers,
      waitingTime: waiting * STEP_SECONDS,
      waitingWithNoneFreeTime: waitingWithNoneFree * STEP_SECONDS,
    };
  }, [points]);

  const series = (list: Series[]) =>
    list.map((s) => (
      <Area
        key={s.key}
        type="stepAfter"
        dataKey={s.key}
        name={t(s.label)}
        stackId="1"
        stroke={s.color}
        fill={s.color}
        fillOpacity={0.7}
        isAnimationActive={false}
      />
    ));

  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
      <XAxis dataKey="hour" minTickGap={24} tick={{ fontSize: 11 }} />
      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
      <Tooltip />
      <Legend wrapperStyle={{ fontSize: 12 }} />
    </>
  );

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[98%] mx-auto my-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">{t("Day Load")}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-40">
              <SelectInput
                options={locationOptions}
                value={
                  locationOptions.find((o) => o.value === String(location)) ??
                  null
                }
                onChange={(o) => o && update({ location: o.value })}
                placeholder={t("Location")}
              />
            </div>
            <DayPicker date={date} onChange={(d) => update({ date: d })} />
          </div>
        </div>

        {!stats ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
            {t("Nothing recorded")}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-3">
              <StatCard
                label={t("Most open calls")}
                value={stats.peakCallCount}
                hint={stats.peakCalls.hour}
              />
              <StatCard
                label={t("Most customers")}
                value={stats.peakCustomers.customers}
                hint={`${stats.peakCustomers.hour} · ${
                  stats.peakCustomers.tables
                } ${t("tables")}`}
              />
              <StatCard
                label={t("A call waiting for someone")}
                value={formatDuration(stats.waitingTime, t)}
              />
              <StatCard
                label={t("A call waiting, nobody free")}
                value={formatDuration(stats.waitingWithNoneFreeTime, t)}
              />
            </div>
            <ChartCard
              title={t("Open calls")}
              note={t(
                "Calls open at each moment by type; the line is the calls nobody had at that moment."
              )}
            >
              <ComposedChart data={points}>
                {axes}
                {series(callSeries)}
                <Line
                  type="stepAfter"
                  dataKey="waitingCalls"
                  name={t("Waiting for someone")}
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ChartCard>
            <ChartCard
              title={t("Staff taking calls")}
              note={t(
                "Game masters, the game manager and service staff in the cafe, and what they were doing. Outside operation not counted."
              )}
            >
              <AreaChart data={points}>
                {axes}
                {series(staffSeries)}
              </AreaChart>
            </ChartCard>
            <ChartCard title={t("Tables and customers")}>
              <AreaChart data={points}>
                {axes}
                <Area
                  type="stepAfter"
                  dataKey="customers"
                  name={t("Customers")}
                  stroke="#0891b2"
                  fill="#0891b2"
                  fillOpacity={0.2}
                  isAnimationActive={false}
                />
                <Area
                  type="stepAfter"
                  dataKey="tables"
                  name={t("Tables")}
                  stroke="#4f46e5"
                  fill="#4f46e5"
                  fillOpacity={0.3}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ChartCard>
            <ChartCard
              title={t("Orders being prepared")}
              note={t("Orders sent and not yet prepared at each moment.")}
            >
              <AreaChart data={points}>
                {axes}
                <Area
                  type="stepAfter"
                  dataKey="preparingOrders"
                  name={t("Orders being prepared")}
                  stroke="#d97706"
                  fill="#d97706"
                  fillOpacity={0.4}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ChartCard>
          </>
        )}
      </div>
    </>
  );
}
