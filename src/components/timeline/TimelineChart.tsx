import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TimelineItem } from "../../utils/api/timeline";
import {
  colorOf,
  daySeconds,
  LaneKey,
  laneLabels,
  laneOf,
  LANES,
  shortHour,
  TimelineLookups,
  TimelineView,
  titleOf,
} from "./timelineDisplay";

type Props = {
  items: TimelineItem[];
  view: TimelineView;
  lookups: TimelineLookups;
  // Where an unfinished item (an open call, a break going on) ends: now on
  // today's timeline, else nowhere (drawn as a moment).
  openEnd?: string;
  // Extra stretch drawn first, e.g. the table's stay.
  background?: { lane: LaneKey; start: string; end?: string; label: string };
  onSelect: (index: number) => void;
  selected?: number;
};

const HOUR = 3600;

// Day at a glance: one lane per kind of thing, bars for what lasts, dots
// for moments. Clicking one shows it in the list below.
export function TimelineChart({
  items,
  view,
  lookups,
  openEnd,
  background,
  onSelect,
  selected,
}: Props) {
  const { t } = useTranslation();

  const { from, to } = useMemo(() => {
    const points = items.flatMap((item) => [
      daySeconds(item.start),
      daySeconds(item.end ?? openEnd ?? item.start),
    ]);
    if (background) {
      points.push(daySeconds(background.start));
      points.push(daySeconds(background.end ?? openEnd ?? background.start));
    }
    if (points.length === 0) return { from: 10 * HOUR, to: 22 * HOUR };
    const min = Math.floor(Math.min(...points) / HOUR) * HOUR;
    const max = Math.ceil(Math.max(...points) / HOUR) * HOUR;
    return { from: min, to: Math.max(max, min + HOUR) };
  }, [items, openEnd, background]);

  const span = to - from;
  const left = (hour: string) => ((daySeconds(hour) - from) / span) * 100 + "%";
  const width = (start: string, end: string) =>
    (Math.max(daySeconds(end) - daySeconds(start), 0) / span) * 100 + "%";

  const ticks: number[] = [];
  for (let s = from; s <= to; s += HOUR) ticks.push(s);

  const lanes = LANES[view].filter(
    (lane) =>
      lane === background?.lane || items.some((item) => laneOf(item) === lane)
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-x-auto">
      <div className="min-w-[720px]">
        {/* Hour axis */}
        <div className="flex">
          <div className="w-32 shrink-0" />
          <div className="relative flex-1 h-5">
            {ticks.map((tick) => (
              <span
                key={tick}
                className="absolute -translate-x-1/2 text-[11px] text-gray-500"
                style={{ left: ((tick - from) / span) * 100 + "%" }}
              >
                {String(Math.floor(tick / HOUR) % 24).padStart(2, "0")}:00
              </span>
            ))}
          </div>
        </div>
        {lanes.map((lane) => (
          <div
            key={lane}
            className="flex items-center border-t border-gray-100"
          >
            <div className="w-32 shrink-0 py-2 pr-2 text-xs font-medium text-gray-600">
              {t(laneLabels[lane])}
            </div>
            <div className="relative flex-1 h-8">
              {ticks.map((tick) => (
                <div
                  key={tick}
                  className="absolute top-0 bottom-0 border-l border-dashed border-gray-100"
                  style={{ left: ((tick - from) / span) * 100 + "%" }}
                />
              ))}
              {background?.lane === lane && (
                <div
                  className="absolute top-1.5 bottom-1.5 rounded bg-cyan-100 border border-cyan-300 text-[11px] text-cyan-800 px-1 truncate"
                  style={{
                    left: left(background.start),
                    width: width(
                      background.start,
                      background.end ?? openEnd ?? background.start
                    ),
                  }}
                  title={background.label}
                >
                  {background.label}
                </div>
              )}
              {items.map((item, index) => {
                if (laneOf(item) !== lane) return null;
                const end = item.end ?? openEnd;
                const title = `${shortHour(item.start)}${
                  end && end !== item.start ? `–${shortHour(end)}` : ""
                } ${titleOf(item, view, lookups)}`;
                const isSelected = selected === index;
                const ring = isSelected
                  ? "ring-2 ring-offset-1 ring-gray-900"
                  : "";
                if (!end || daySeconds(end) - daySeconds(item.start) < 60) {
                  return (
                    <button
                      key={index}
                      type="button"
                      title={title}
                      onClick={() => onSelect(index)}
                      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border border-white ${colorOf(
                        item
                      )} ${ring} hover:scale-150 transition-transform`}
                      style={{ left: left(item.start) }}
                    />
                  );
                }
                return (
                  <button
                    key={index}
                    type="button"
                    title={title}
                    onClick={() => onSelect(index)}
                    className={`absolute top-1.5 bottom-1.5 rounded ${colorOf(
                      item
                    )} ${ring} opacity-90 hover:opacity-100 min-w-[3px]`}
                    style={{
                      left: left(item.start),
                      width: width(item.start, end),
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
