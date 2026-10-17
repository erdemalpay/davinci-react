import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import {
  assignmentActionColors,
  assignmentActionLabels,
  AssignmentStep,
  formatDeclineReason,
  gmCallReasonLabels,
} from "../components/buttonCalls/assignmentDisplay";
import SelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import { DayPicker } from "../components/timeline/DayPicker";
import {
  defaultLocationId,
  durationBetween,
  formatDuration,
  makeNames,
  shortHour,
} from "../components/timeline/timelineDisplay";
import { useTimelineLookups } from "../components/timeline/useTimelineLookups";
import { Routes } from "../navigation/constants";
import {
  AssignmentActionEnum,
  ButtonCallTypeEnum,
  GmCallReasonEnum,
} from "../types";
import { useGetStoreLocations } from "../utils/api/location";
import {
  useGetWaitingCalls,
  WaitingCall,
  WaitingReason,
} from "../utils/api/timeline";

// Waits shorter than this many minutes are hidden by default: the
// assignment usually runs within a few seconds.
const DEFAULT_MIN_WAIT_MINUTES = 1;

const reasons: {
  key: WaitingReason;
  label: string;
  hint: string;
  color: string;
}[] = [
  {
    key: "allBusy",
    label: "Everyone was busy",
    hint: "Everyone who could take the call was busy.",
    color: "#dc2626",
  },
  {
    key: "otherRoleFree",
    label: "Only staff for other calls were free",
    hint: "Someone was free but doesn't take this kind of call, e.g. service staff while a game master call waits.",
    color: "#f97316",
  },
  {
    key: "gameUnknown",
    label: "Free staff don't know the game",
    hint: "The call is about a game, and nobody free knows it.",
    color: "#eab308",
  },
  {
    key: "declined",
    label: "Free staff had declined it",
    hint: "The free ones had declined this call.",
    color: "#8b5cf6",
  },
  {
    key: "upstairsDuty",
    label: "Only the upstairs duty was free",
    hint: "The upstairs duty takes only the upstairs tables' calls.",
    color: "#14b8a6",
  },
  {
    key: "notAssigned",
    label: "Someone free could have taken it",
    hint: "Someone free could take it; the assignment hadn't run yet, or the records differ from what it saw.",
    color: "#2563eb",
  },
  {
    key: "nobodyInCafe",
    label: "Nobody in the cafe could take it",
    hint: "Nobody who takes this kind of call was in the cafe.",
    color: "#6b7280",
  },
];
const reasonOf = (key: WaitingReason) =>
  reasons.find((r) => r.key === key) ?? reasons[0];

type Segment = WaitingCall["segments"][number];

// The stretches and what happened to the call (assigned, declined, taken
// over), in time order; at the same moment the event first.
function callRows(call: WaitingCall) {
  const rows: (
    | { kind: "segment"; at: number; segment: Segment }
    | { kind: "event"; at: number; event: AssignmentStep }
  )[] = [
    ...call.segments.map((segment) => ({
      kind: "segment" as const,
      at: durationBetween(call.start, segment.start) + 0.5,
      segment,
    })),
    ...(call.events ?? []).map((event) => ({
      kind: "event" as const,
      at: durationBetween(call.start, event.hour),
      event,
    })),
  ];
  return rows.sort((a, b) => a.at - b.at);
}

const callTypeLabel = (type: string) =>
  type === ButtonCallTypeEnum.ORDERCALL
    ? "Service call"
    : type === ButtonCallTypeEnum.ORDERREADYCALL
    ? "Order Ready Call"
    : "Game master call";

// The calls that waited for someone through a day, and why at each
// stretch. For managers.
export default function WaitingCalls() {
  const { t } = useTranslation();
  const lookups = useTimelineLookups();
  const names = makeNames(lookups);
  const locations = useGetStoreLocations() ?? [];
  const [params, setParams] = useSearchParams();
  const date = params.get("date") ?? format(new Date(), "yyyy-MM-dd");
  const location =
    Number(params.get("location")) || defaultLocationId(locations);
  const calls = useGetWaitingCalls(location, date);
  const [reason, setReason] = useState<WaitingReason>();
  const [minWaitMinutes, setMinWaitMinutes] = useState(
    String(DEFAULT_MIN_WAIT_MINUTES)
  );
  const [onlyClosedUnanswered, setOnlyClosedUnanswered] = useState(false);
  const minWaitSeconds = Math.max(0, Number(minWaitMinutes) || 0) * 60;

  const update = (changes: Record<string, string>) =>
    setParams({ date, location: String(location), ...changes });

  const locationOptions = locations.map((l) => ({
    value: String(l._id),
    label: l.name,
  }));

  const longEnough = useMemo(
    () =>
      calls.filter(
        (c) =>
          c.waited >= minWaitSeconds &&
          // Closed while nobody had it: the table gave up, or someone
          // closed it without taking it.
          (!onlyClosedUnanswered || (!!c.end && !c.assignedTo))
      ),
    [calls, minWaitSeconds, onlyClosedUnanswered]
  );
  const hiddenCount = calls.length - longEnough.length;

  const totals = useMemo(
    () =>
      reasons
        .map((r) => {
          const withReason = longEnough.filter((c) =>
            c.segments.some((s) => s.reason === r.key)
          );
          const seconds = longEnough
            .flatMap((c) => c.segments)
            .filter((s) => s.reason === r.key)
            .reduce((sum, s) => sum + durationBetween(s.start, s.end), 0);
          return { ...r, seconds, count: withReason.length };
        })
        .filter((r) => r.seconds > 0),
    [longEnough]
  );

  const shown = reason
    ? longEnough.filter((c) => c.segments.some((s) => s.reason === reason))
    : longEnough;

  const callTitle = (call: WaitingCall) => {
    const parts = [t(callTypeLabel(call.callType))];
    if (call.gmCallReason) {
      parts.push(t(gmCallReasonLabels[call.gmCallReason as GmCallReasonEnum]));
    }
    if (call.game) parts.push(names.game(call.game));
    return parts.join(" · ");
  };

  const personLinks = (users: string[]) =>
    users.map((user, i) => (
      <span key={user}>
        {i > 0 && ", "}
        <Link
          className="text-blue-700 hover:underline"
          to={`${Routes.PersonTimeline}?user=${encodeURIComponent(
            user
          )}&date=${date}`}
        >
          {names.user(user)}
        </Link>
      </span>
    ));

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[98%] mx-auto my-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">{t("Waiting Calls")}</h1>
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

        <div className="flex flex-wrap gap-3">
          {totals.map((r) => (
            <button
              key={r.key}
              type="button"
              title={t(r.hint)}
              onClick={() => setReason(reason === r.key ? undefined : r.key)}
              className={`text-left bg-white rounded-lg border px-4 py-3 min-w-[160px] max-w-[240px] ${
                reason === r.key
                  ? "border-gray-900 ring-1 ring-gray-900"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: r.color }}
                />
                {t(r.label)}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {formatDuration(r.seconds, t)}
              </div>
              <div className="text-xs text-gray-500">
                {r.count} {t("calls")}
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
          <label className="flex items-center gap-2">
            {t("Waited at least")}
            <input
              type="number"
              min={0}
              step={1}
              value={minWaitMinutes}
              onChange={(e) => setMinWaitMinutes(e.target.value)}
              className="w-16 rounded border border-gray-300 px-2 py-1 text-gray-900"
            />
            {t("min")}
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyClosedUnanswered}
              onChange={(e) => setOnlyClosedUnanswered(e.target.checked)}
            />
            {t("Only calls closed without anyone taking them")}
          </label>
          {hiddenCount > 0 && (
            <span className="text-gray-400">
              ({hiddenCount} {t("hidden")})
            </span>
          )}
        </div>

        {shown.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
            {t("No call waited")}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {shown.map((call) => (
              <div
                key={call.callId}
                className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-2"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-semibold text-gray-900">
                      {shortHour(call.start)}
                    </span>
                    {call.table !== undefined ? (
                      <Link
                        className="text-blue-700 hover:underline"
                        to={`${Routes.TableTimeline}?table=${call.table}`}
                      >
                        {t("Table")} {call.tableName}
                      </Link>
                    ) : (
                      <span>
                        {t("Table")} {call.tableName}
                      </span>
                    )}
                    <span className="text-sm text-gray-600">
                      {callTitle(call)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">{t("Waited")} </span>
                    <span className="font-semibold text-gray-900">
                      {formatDuration(call.waited, t)}
                    </span>
                  </div>
                </div>

                <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  {call.segments.map((s) => (
                    <div
                      key={s.start}
                      title={t(reasonOf(s.reason).label)}
                      style={{
                        width: `${
                          (durationBetween(s.start, s.end) /
                            Math.max(call.waited, 1)) *
                          100
                        }%`,
                        backgroundColor: reasonOf(s.reason).color,
                      }}
                    />
                  ))}
                </div>

                <ul className="flex flex-col gap-1 text-sm">
                  {callRows(call).map((row) => {
                    if (row.kind === "event") {
                      const e = row.event;
                      return (
                        <li
                          key={`e-${e.hour}-${e.action}-${e.user}`}
                          className="flex items-start gap-2 text-gray-600"
                        >
                          <span
                            className={`mt-1.5 h-2 w-2 shrink-0 rotate-45 ${
                              assignmentActionColors[e.action]
                            }`}
                          />
                          <span>
                            <span className="text-gray-500">
                              {shortHour(e.hour)} ·{" "}
                            </span>
                            {t(assignmentActionLabels[e.action])}:{" "}
                            {personLinks([e.user])}
                            {e.action === AssignmentActionEnum.CLAIMED &&
                              e.fromUser && (
                                <span className="text-gray-500">
                                  {" "}
                                  ({t("previously")}: {names.user(e.fromUser)})
                                </span>
                              )}
                            {e.action === AssignmentActionEnum.DECLINED &&
                              e.reason && (
                                <span className="font-medium text-gray-900">
                                  {" "}
                                  — {formatDeclineReason(e, t, lookups.games)}
                                </span>
                              )}
                          </span>
                        </li>
                      );
                    }
                    const s = row.segment;
                    return (
                      <li key={s.start} className="flex items-start gap-2">
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: reasonOf(s.reason).color }}
                        />
                        <span>
                          <span className="text-gray-500">
                            {shortHour(s.start)}–{shortHour(s.end)} ·{" "}
                            {formatDuration(durationBetween(s.start, s.end), t)}{" "}
                            ·{" "}
                          </span>
                          <span className="text-gray-900">
                            {t(reasonOf(s.reason).label)}
                          </span>
                          {s.free.length > 0 && (
                            <span className="text-gray-500">
                              {" "}
                              ({t("free")}: {personLinks(s.free)})
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <div className="text-xs text-gray-500">
                  {call.assignedTo ? (
                    <>
                      {t("Taken by")} {personLinks([call.assignedTo])}
                    </>
                  ) : call.end ? (
                    <>
                      {t("Closed without anyone")}
                      {call.closedBy && <> · {personLinks([call.closedBy])}</>}
                    </>
                  ) : (
                    t("Still waiting")
                  )}
                  {call.end && <> · {shortHour(call.end)}</>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
