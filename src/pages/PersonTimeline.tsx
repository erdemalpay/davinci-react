import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import SelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import { DayPicker } from "../components/timeline/DayPicker";
import { StatCard } from "../components/timeline/StatCard";
import { TimelineChart } from "../components/timeline/TimelineChart";
import {
  durationBetween,
  formatDuration,
  formatMoney,
  shortHour,
} from "../components/timeline/timelineDisplay";
import { TimelineList } from "../components/timeline/TimelineList";
import { useTimelineLookups } from "../components/timeline/useTimelineLookups";
import { useDataContext } from "../context/Data.context";
import { BreakTypeEnum } from "../types";
import { useGetUserTimeline } from "../utils/api/timeline";

// What one person did through a day, for managers.
export default function PersonTimeline() {
  const { t } = useTranslation();
  const lookups = useTimelineLookups();
  const { users = [] } = useDataContext();
  const [params, setParams] = useSearchParams();
  const today = format(new Date(), "yyyy-MM-dd");
  const user = params.get("user") ?? "";
  const date = params.get("date") ?? today;
  const [selected, setSelected] = useState<number>();
  const timeline = useGetUserTimeline(user, date);
  const items = useMemo(() => timeline?.items ?? [], [timeline]);

  const update = (changes: Record<string, string>) => {
    setSelected(undefined);
    setParams({ user, date, ...changes });
  };

  const userOptions = useMemo(
    () =>
      users
        .map((u) => ({ value: u._id, label: u.name }))
        .sort((a, b) => a.label.localeCompare(b.label, "tr")),
    [users]
  );

  const stats = useMemo(() => {
    const sum = (kind: string, filter?: (i: (typeof items)[0]) => boolean) =>
      items
        .filter((i) => i.kind === kind && (!filter || filter(i)))
        .reduce((total, i) => total + durationBetween(i.start, i.end), 0);
    const count = (filter: (i: (typeof items)[0]) => boolean) =>
      items.filter(filter).length;
    const visits = items.filter((i) => i.kind === "visit");
    const orderCount = (action: string) =>
      items
        .filter((i) => i.kind === "order" && i.orderAction === action)
        .reduce(
          (n, i) => n + (i.orders ?? []).reduce((q, o) => q + o.quantity, 0),
          0
        );
    return {
      inCafe: visits.length
        ? `${shortHour(visits[0].start)}–${
            shortHour(visits[visits.length - 1].end) || "…"
          }`
        : "–",
      breakTime: sum("break", (i) => i.breakType === BreakTypeEnum.BREAK),
      busyTime: sum("break", (i) => i.breakType !== BreakTypeEnum.BREAK),
      games: count((i) => i.kind === "gameplay"),
      explaining: sum("explanation"),
      callsHandled: count(
        (i) =>
          i.kind === "call" && ["handled", "open"].includes(i.outcome ?? "")
      ),
      callsDeclined: count(
        (i) => i.kind === "call" && i.outcome === "declined"
      ),
      ordersTaken: orderCount("created"),
      ordersPrepared: orderCount("prepared"),
      ordersDelivered: orderCount("delivered"),
      payments: items
        .filter((i) => i.kind === "payment" && !i.cancelled)
        .reduce((total, i) => total + (i.amount ?? 0), 0),
    };
  }, [items]);

  const openEnd = date === today ? format(new Date(), "HH:mm:ss") : undefined;

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[98%] mx-auto my-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">{t("Person Timeline")}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-56">
              <SelectInput
                options={userOptions}
                value={userOptions.find((o) => o.value === user) ?? null}
                onChange={(option) => option && update({ user: option.value })}
                placeholder={t("Person")}
              />
            </div>
            <DayPicker date={date} onChange={(d) => update({ date: d })} />
          </div>
        </div>

        {!user ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
            {t("Pick a person to see their day.")}
          </div>
        ) : !timeline ? (
          <div className="p-6 text-center text-gray-500">{t("Loading...")}</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-3">
              <StatCard label={t("In the cafe")} value={stats.inCafe} />
              <StatCard
                label={t("Games explained")}
                value={stats.games}
                hint={formatDuration(stats.explaining, t)}
              />
              <StatCard
                label={t("Calls handled")}
                value={stats.callsHandled}
                hint={`${stats.callsDeclined} ${t("declined")}`}
              />
              <StatCard
                label={t("Orders")}
                value={stats.ordersTaken}
                hint={`${t("Prepared")} ${stats.ordersPrepared} · ${t(
                  "Delivered"
                )} ${stats.ordersDelivered}`}
              />
              <StatCard
                label={t("Payments taken")}
                value={formatMoney(stats.payments)}
              />
              <StatCard
                label={t("Break")}
                value={formatDuration(stats.breakTime, t)}
                hint={`${t("Busy")} ${formatDuration(stats.busyTime, t)}`}
              />
            </div>
            <TimelineChart
              items={items}
              view="person"
              lookups={lookups}
              openEnd={openEnd}
              selected={selected}
              onSelect={setSelected}
            />
            <TimelineList
              items={items}
              view="person"
              lookups={lookups}
              date={date}
              selected={selected}
              onSelect={setSelected}
            />
          </>
        )}
      </div>
    </>
  );
}
