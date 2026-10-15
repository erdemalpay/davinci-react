import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import SelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import { DayPicker } from "../components/timeline/DayPicker";
import { StatCard } from "../components/timeline/StatCard";
import { TimelineChart } from "../components/timeline/TimelineChart";
import {
  durationBetween,
  formatDuration,
  formatMoney,
  makeNames,
  shortHour,
} from "../components/timeline/timelineDisplay";
import { TimelineList } from "../components/timeline/TimelineList";
import { useTimelineLookups } from "../components/timeline/useTimelineLookups";
import { Routes } from "../navigation/constants";
import { ButtonCallTypeEnum, Table } from "../types";
import { Paths, useGet } from "../utils/api/factory";
import { useGetStoreLocations } from "../utils/api/location";
import { useGetTableTimeline } from "../utils/api/timeline";

// Everything that happened at one table while it was open, for managers.
export default function TableTimeline() {
  const { t } = useTranslation();
  const lookups = useTimelineLookups();
  const names = makeNames(lookups);
  const locations = useGetStoreLocations() ?? [];
  const [params, setParams] = useSearchParams();
  const tableId = Number(params.get("table")) || undefined;
  const timeline = useGetTableTimeline(tableId);
  const [selected, setSelected] = useState<number>();

  // Picking a table: the day and location of the table shown, else today.
  const date =
    params.get("date") ??
    timeline?.table.date ??
    format(new Date(), "yyyy-MM-dd");
  const location =
    Number(params.get("location")) ||
    timeline?.table.location ||
    locations[0]?._id ||
    0;
  const tables =
    useGet<Table[]>(
      `${Paths.Tables}?location=${location}&date=${date}`,
      [Paths.Tables, location, date],
      true,
      { enabled: !!location }
    ) ?? [];

  const update = (changes: Record<string, string>) => {
    setSelected(undefined);
    const next: Record<string, string> = {
      date,
      location: String(location),
      ...changes,
    };
    if (
      tableId &&
      !("table" in changes) &&
      !("date" in changes) &&
      !("location" in changes)
    ) {
      next.table = String(tableId);
    }
    setParams(next);
  };

  const tableOptions = useMemo(
    () =>
      [...tables]
        .sort((a, b) => a.startHour.localeCompare(b.startHour))
        .map((table) => ({
          value: String(table._id),
          label: `${table.name} · ${shortHour(table.startHour)}–${
            shortHour(table.finishHour) || "…"
          } · ${table.playerCount} ${t("people")}`,
        })),
    [tables, t]
  );
  const locationOptions = locations.map((l) => ({
    value: String(l._id),
    label: l.name,
  }));

  const items = useMemo(() => timeline?.items ?? [], [timeline]);
  const table = timeline?.table;
  const isOpen = !!table && !table.finishHour;
  const today = format(new Date(), "yyyy-MM-dd");
  const openEnd =
    isOpen && table?.date === today
      ? format(new Date(), "HH:mm:ss")
      : undefined;

  const stats = useMemo(() => {
    const calls = items.filter((i) => i.kind === "call");
    const callsOf = (type: string) =>
      calls.filter((c) => c.callType === type).length;
    const ordered = items
      .filter((i) => i.kind === "order" && i.orderAction === "created")
      .reduce(
        (n, i) => n + (i.orders ?? []).reduce((q, o) => q + o.quantity, 0),
        0
      );
    const longestWait = Math.max(
      0,
      ...calls.map((c) => durationBetween(c.start, c.end ?? openEnd))
    );
    return {
      games: items.filter((i) => i.kind === "gameplay").length,
      gmCalls: callsOf(ButtonCallTypeEnum.GAMEMASTERCALL),
      serviceCalls: callsOf(ButtonCallTypeEnum.ORDERCALL),
      longestWait,
      ordered,
      paid: items
        .filter((i) => i.kind === "payment" && !i.cancelled)
        .reduce((total, i) => total + (i.amount ?? 0), 0),
    };
  }, [items, openEnd]);

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[98%] mx-auto my-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">{t("Table Timeline")}</h1>
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
            <div className="w-72">
              <SelectInput
                options={tableOptions}
                value={
                  tableOptions.find((o) => o.value === String(tableId)) ?? null
                }
                onChange={(o) => o && update({ table: o.value })}
                placeholder={t("Table")}
              />
            </div>
          </div>
        </div>

        {!tableId ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
            {t("Pick a table to see its timeline.")}
          </div>
        ) : !timeline || !table ? (
          <div className="p-6 text-center text-gray-500">{t("Loading...")}</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-3">
              <StatCard
                label={`${t("Table")} ${table.name}`}
                value={`${shortHour(table.startHour)}–${
                  shortHour(table.finishHour) || "…"
                }`}
                hint={`${table.date} · ${names.location(table.location)}`}
              />
              <StatCard
                label={t("Stayed")}
                value={formatDuration(
                  durationBetween(table.startHour, table.finishHour ?? openEnd),
                  t
                )}
                hint={`${table.playerCount} ${t("people")}`}
              />
              <StatCard label={t("Games played")} value={stats.games} />
              <StatCard
                label={t("Calls")}
                value={stats.gmCalls + stats.serviceCalls}
                hint={`${t("GM")} ${stats.gmCalls} · ${t("Service")} ${
                  stats.serviceCalls
                }`}
              />
              <StatCard
                label={t("Longest call")}
                value={formatDuration(stats.longestWait, t)}
              />
              <StatCard label={t("Items ordered")} value={stats.ordered} />
              <StatCard label={t("Paid")} value={formatMoney(stats.paid)} />
            </div>
            {table.createdBy && (
              <div className="text-sm text-gray-600">
                {t("Opened by")}:{" "}
                <Link
                  className="text-blue-700 hover:underline"
                  to={`${Routes.PersonTimeline}?user=${encodeURIComponent(
                    table.createdBy
                  )}&date=${table.date}`}
                >
                  {names.user(table.createdBy)}
                </Link>
              </div>
            )}
            <TimelineChart
              items={items}
              view="table"
              lookups={lookups}
              openEnd={openEnd}
              background={{
                lane: "table",
                start: table.startHour,
                end: table.finishHour,
                label: `${table.name} · ${table.playerCount} ${t("people")}`,
              }}
              selected={selected}
              onSelect={setSelected}
            />
            <TimelineList
              items={items}
              view="table"
              lookups={lookups}
              date={table.date}
              selected={selected}
              onSelect={setSelected}
            />
          </>
        )}
      </div>
    </>
  );
}
