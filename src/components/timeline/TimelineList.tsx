import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Routes } from "../../navigation/constants";
import { AssignmentActionEnum } from "../../types";
import { TimelineItem } from "../../utils/api/timeline";
import {
  colorOf,
  declineText,
  durationBetween,
  formatDuration,
  iconOf,
  makeNames,
  orderLinesText,
  outcomeLabels,
  shortHour,
  TimelineLookups,
  TimelineView,
  titleOf,
} from "./timelineDisplay";

type Props = {
  items: TimelineItem[];
  view: TimelineView;
  lookups: TimelineLookups;
  date: string;
  selected?: number;
  onSelect: (index: number) => void;
};

// Everything in order, newest last, with the details of each.
export function TimelineList({
  items,
  view,
  lookups,
  date,
  selected,
  onSelect,
}: Props) {
  const { t } = lookups;
  const names = makeNames(lookups);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (selected === undefined) return;
    rowRefs.current[selected]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [selected]);

  const personLink = (user?: string) =>
    user ? (
      <Link
        className="text-blue-700 hover:underline"
        to={`${Routes.PersonTimeline}?user=${encodeURIComponent(
          user
        )}&date=${date}`}
      >
        {names.user(user)}
      </Link>
    ) : null;

  const tableLink = (item: TimelineItem) =>
    item.tableName ? (
      item.table !== undefined ? (
        <Link
          className="text-blue-700 hover:underline"
          to={`${Routes.TableTimeline}?table=${item.table}`}
        >
          {t("Table")} {item.tableName}
        </Link>
      ) : (
        <span>
          {t("Table")} {item.tableName}
        </span>
      )
    ) : null;

  const details = (item: TimelineItem) => {
    const lines: React.ReactNode[] = [];
    const duration = durationBetween(item.start, item.end);
    switch (item.kind) {
      case "shift":
        if (item.isServiceStaff) lines.push(t("Service staff"));
        if (item.isMiddleman) lines.push(t("Middleman"));
        if (item.isOutsideOperation) lines.push(t("Outside operation"));
        if (item.location !== undefined)
          lines.push(names.location(item.location));
        break;
      case "visit":
        if (item.location !== undefined)
          lines.push(names.location(item.location));
        break;
      case "break":
        if (item.note) lines.push(item.note);
        break;
      case "tableOpened":
        lines.push(tableLink(item));
        if (item.playerCount) lines.push(`${item.playerCount} ${t("people")}`);
        break;
      case "gameplay":
        if (view === "person") {
          lines.push(tableLink(item));
        } else {
          lines.push(
            <>
              {t("Explained by")}: {personLink(item.user)}
            </>
          );
        }
        if (item.playerCount) lines.push(`${item.playerCount} ${t("people")}`);
        break;
      case "explanation":
        if (view === "person") lines.push(tableLink(item));
        break;
      case "call":
        if (view === "person") {
          lines.push(tableLink(item));
          if (item.outcome) {
            let text = t(outcomeLabels[item.outcome]);
            if (item.outcome === "declined" && item.declineReason) {
              text += `: ${declineText(
                item.declineReason,
                item.note,
                undefined,
                lookups
              )}`;
            }
            lines.push(
              <>
                {text}
                {item.outcome === "takenOver" && item.user && (
                  <> ({personLink(item.user)})</>
                )}
              </>
            );
          }
        }
        if (item.game && view === "person") lines.push(names.game(item.game));
        if (view === "table" && item.game) lines.push(names.game(item.game));
        if (item.callStart && item.callEnd && view === "person") {
          lines.push(
            `${t("Call")}: ${shortHour(item.callStart)}–${shortHour(
              item.callEnd
            )}`
          );
        }
        break;
      case "order":
        lines.push(orderLinesText(item, lookups));
        if (view === "person") lines.push(tableLink(item));
        else if (item.user) lines.push(personLink(item.user));
        break;
      case "payment":
        lines.push(names.paymentMethod(item.paymentMethod));
        if (view === "person") lines.push(tableLink(item));
        else if (item.user) lines.push(personLink(item.user));
        if (item.cancelled) {
          lines.push(
            <span className="text-red-600">
              {t("Cancelled")}
              {item.cancelledBy ? ` (${names.user(item.cancelledBy)})` : ""}
            </span>
          );
        }
        break;
    }
    if (duration > 0) lines.push(formatDuration(duration, t));
    return lines.filter(Boolean);
  };

  // A call's steps on the table's timeline: who got it, who declined, who
  // took it over, who closed it.
  const callSteps = (item: TimelineItem) => {
    const steps = (item.history ?? []).map((step, i) => {
      const who = personLink(step.user);
      let text: React.ReactNode;
      if (step.action === AssignmentActionEnum.ASSIGNED) {
        text = (
          <>
            {who} {t("was assigned")}
          </>
        );
      } else if (step.action === AssignmentActionEnum.CLAIMED) {
        text = (
          <>
            {who} {t("took it over")}
            {step.fromUser && <> ({names.user(step.fromUser)})</>}
          </>
        );
      } else {
        text = (
          <>
            {who} {t("declined")}
            {step.reason &&
              `: ${declineText(step.reason, step.note, step.game, lookups)}`}
          </>
        );
      }
      return (
        <li key={i} className="flex gap-2">
          <span className="text-gray-500 tabular-nums">
            {shortHour(step.hour)}
          </span>
          <span>{text}</span>
        </li>
      );
    });
    if (item.end) {
      steps.push(
        <li key="closed" className="flex gap-2">
          <span className="text-gray-500 tabular-nums">
            {shortHour(item.end)}
          </span>
          <span>
            {t("Closed")}
            {item.closedBy && <> ({personLink(item.closedBy)})</>}
          </span>
        </li>
      );
    }
    if (steps.length === 0) return null;
    return <ul className="mt-1 text-xs text-gray-700 space-y-0.5">{steps}</ul>;
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
        {t("Nothing recorded")}
      </div>
    );
  }

  return (
    <ol className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
      {items.map((item, index) => {
        const Icon = iconOf(item);
        const lines = details(item);
        return (
          <li
            key={index}
            ref={(el) => (rowRefs.current[index] = el)}
            onClick={() => onSelect(index)}
            className={`flex gap-3 px-4 py-3 cursor-pointer ${
              selected === index ? "bg-yellow-50" : "hover:bg-gray-50"
            }`}
          >
            <div className="w-24 shrink-0 text-sm tabular-nums text-gray-600">
              {shortHour(item.start)}
              {item.end && item.end !== item.start && (
                <span className="text-gray-400">–{shortHour(item.end)}</span>
              )}
            </div>
            <div
              className={`mt-0.5 h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-white ${colorOf(
                item
              )}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900">
                {titleOf(item, view, lookups)}
              </div>
              {lines.length > 0 && (
                <div className="text-xs text-gray-600 flex flex-wrap gap-x-2">
                  {lines.map((line, i) => (
                    <span
                      key={i}
                      className="after:content-['·'] after:ml-2 last:after:content-none"
                    >
                      {line}
                    </span>
                  ))}
                </div>
              )}
              {view === "table" && item.kind === "call" && callSteps(item)}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
