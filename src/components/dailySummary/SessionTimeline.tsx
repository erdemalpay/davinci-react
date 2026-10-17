import { format, isToday, isValid, parse } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getItem } from "../../utils/getItem";

export type TimelineSession = {
  _id: number;
  user: string | { _id?: string; name?: string };
  startHour?: string;
  finishHour?: string;
};

type Props = {
  title: string;
  emptyText: string;
  sessions?: TimelineSession[];
  date: string;
  users?: { _id: string; name: string }[];
};

// Fixed range: 12:00 (720 min) to 00:20 (1460 min).
const BAR_START_MINUTES = 12 * 60;
const BAR_END_MINUTES = 24 * 60 + 20;
const BAR_TOTAL_MINUTES = BAR_END_MINUTES - BAR_START_MINUTES;

// Hour marks; 00:00 is only a line inside the bar (00:20 is shown at the
// right end).
const TIMELINE_TICKS = [
  { label: "12:00", minutes: 12 * 60 },
  { label: "14:00", minutes: 14 * 60 },
  { label: "16:00", minutes: 16 * 60 },
  { label: "18:00", minutes: 18 * 60 },
  { label: "20:00", minutes: 20 * 60 },
  { label: "22:00", minutes: 22 * 60 },
  { label: "00:00", minutes: 24 * 60 },
];
const TICK_LABELS = TIMELINE_TICKS.slice(0, -1);

const PALETTE = [
  "#6366F1",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
];

const hashUserId = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
};

const getUserColor = (userId: string) =>
  PALETTE[hashUserId(userId) % PALETTE.length];

// Hours past midnight (before 06:00) belong to the night: +1440.
const timeToMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m;
  return total < 6 * 60 ? total + 24 * 60 : total;
};

const strToDate = (s?: string) => {
  if (!s) return new Date();
  const d = parse(s, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : new Date();
};

// Who held a role (middleman, upstairs duty) through the day, one bar per
// session, coloured per person.
export function SessionTimeline({
  title,
  emptyText,
  sessions,
  date,
  users = [],
}: Props) {
  const { t } = useTranslation();
  const [hoveredSegmentText, setHoveredSegmentText] = useState<string | null>(
    null
  );

  const getSessionDisplayInfo = (session: TimelineSession) => {
    const userId =
      typeof session.user === "string" ? session.user : session.user?._id;
    const userName =
      getItem(userId, users)?.name ||
      (typeof session.user === "object" ? session.user?.name : userId);
    const color = getUserColor(userId ?? "");
    const tooltipText = session.startHour
      ? session.finishHour
        ? `${userName}: ${session.startHour} – ${session.finishHour}`
        : `${userName}: ${session.startHour} – ${t("ongoing")}`
      : undefined;
    return { userId, userName: userName ?? userId, color, tooltipText };
  };

  return (
    <div className="bg-white rounded-xl shadow p-4 overflow-visible">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <div className="overflow-x-auto overflow-y-visible pb-1 -mx-1">
        <div className="min-w-[280px] w-full flex flex-col">
          {/* Saat işaretleri - sadece masaüstünde (mobilde liste kullanılıyor) */}
          <div className="order-1 hidden sm:block relative w-full min-h-[1.75rem] text-xs text-gray-500 mb-1.5">
            {TICK_LABELS.map((tick) => {
              const tickMin =
                tick.minutes >= 12 * 60 ? tick.minutes : tick.minutes + 24 * 60;
              const pct =
                ((Math.min(tickMin, BAR_END_MINUTES) - BAR_START_MINUTES) /
                  BAR_TOTAL_MINUTES) *
                100;
              if (pct < 0 || pct > 100) return null;
              const isReducedOnMobile =
                tick.label !== "12:00" && tick.label !== "18:00";
              return (
                <span
                  key={tick.label}
                  className={`absolute whitespace-nowrap ${
                    isReducedOnMobile ? "hidden sm:inline" : ""
                  }`}
                  style={{
                    left: `${pct}%`,
                    transform:
                      pct <= 5
                        ? "translateX(0)"
                        : pct >= 95
                        ? "translateX(-100%)"
                        : "translateX(-50%)",
                  }}
                >
                  {tick.label}
                </span>
              );
            })}
            <span className="absolute whitespace-nowrap right-0">00:20</span>
          </div>
          {/* Bar - sadece masaüstünde; mobilde liste gösteriliyor */}
          <div className="order-3 sm:order-2 hidden sm:block relative w-full h-8 sm:h-6 bg-gray-100 rounded-lg overflow-visible border border-gray-200">
            {/* İçteki saat çizgileri */}
            {TIMELINE_TICKS.slice(1).map((tick) => {
              const tickMin =
                tick.minutes >= 12 * 60 ? tick.minutes : tick.minutes + 24 * 60;
              const pct =
                ((Math.min(tickMin, BAR_END_MINUTES) - BAR_START_MINUTES) /
                  BAR_TOTAL_MINUTES) *
                100;
              if (pct <= 0 || pct >= 100) return null;
              return (
                <div
                  key={`line-${tick.label}`}
                  className="absolute top-0 bottom-0 w-px bg-gray-300 z-0"
                  style={{ left: `${pct}%` }}
                />
              );
            })}
            {sessions && sessions.length > 0
              ? sessions.map((session) => {
                  if (!session.startHour) return null;

                  const startMin = timeToMinutes(session.startHour);
                  const nowMin = isToday(strToDate(date))
                    ? timeToMinutes(format(new Date(), "HH:mm"))
                    : BAR_END_MINUTES;
                  const endMin = session.finishHour
                    ? timeToMinutes(session.finishHour)
                    : nowMin;

                  const clampedStart = Math.max(startMin, BAR_START_MINUTES);
                  const clampedEnd = Math.min(endMin, BAR_END_MINUTES);

                  if (clampedEnd <= clampedStart) return null;

                  const leftPct =
                    ((clampedStart - BAR_START_MINUTES) / BAR_TOTAL_MINUTES) *
                    100;
                  const widthPct =
                    ((clampedEnd - clampedStart) / BAR_TOTAL_MINUTES) * 100;

                  const { color, tooltipText } = getSessionDisplayInfo(session);
                  const isOngoing = !session.finishHour;
                  if (!tooltipText) return null;

                  return (
                    <div
                      key={session._id}
                      className={`absolute top-0 h-full rounded-md cursor-pointer transition-all z-10 ring-1 ring-white/40 hover:ring-white/70 hover:brightness-110 ${
                        isOngoing ? "animate-pulse" : ""
                      }`}
                      style={{
                        left: `${leftPct}%`,
                        width: `${Math.max(widthPct, 0.5)}%`,
                        backgroundColor: color,
                        minWidth: "6px",
                      }}
                      onMouseEnter={() => setHoveredSegmentText(tooltipText)}
                      onMouseLeave={() => setHoveredSegmentText(null)}
                      onClick={() => setHoveredSegmentText(tooltipText)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setHoveredSegmentText(tooltipText);
                        }
                      }}
                      aria-label={tooltipText}
                    />
                  );
                })
              : null}
          </div>
          {/* Mobil: renklerin sıkışmaması için oturum listesi (masaüstünde bar var) */}
          {sessions && sessions.length > 0 && (
            <div className="order-3 sm:order-2 block sm:hidden mt-1">
              <ul className="space-y-2">
                {sessions.map((session) => {
                  if (!session.startHour) return null;
                  const { userName, color, tooltipText } =
                    getSessionDisplayInfo(session);
                  if (!tooltipText) return null;
                  const isSelected = hoveredSegmentText === tooltipText;
                  return (
                    <li key={session._id}>
                      <button
                        type="button"
                        onClick={() =>
                          setHoveredSegmentText(isSelected ? null : tooltipText)
                        }
                        className={`w-full flex items-center gap-2.5 text-left py-2 px-3 rounded-lg border transition-colors ${
                          isSelected
                            ? "bg-gray-100 border-gray-300 ring-1 ring-gray-200"
                            : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-sm shrink-0 ring-1 ring-gray-200"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {userName}
                        </span>
                        <span className="text-xs text-gray-500 ml-auto shrink-0">
                          {session.startHour}
                          {session.finishHour
                            ? ` – ${session.finishHour}`
                            : ` – ${t("ongoing")}`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {/* Hover / tap bilgisi: mobilde barın üstünde, masaüstünde barın altında (legend ile çakışmasın) */}
          {sessions && sessions.length > 0 && (
            <div className="order-2 sm:order-3 min-h-[2rem] mt-1.5 sm:mt-1.5 mb-1.5 sm:mb-1.5 flex items-center justify-center gap-2">
              {hoveredSegmentText ? (
                <>
                  <span className="text-xs font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                    {hoveredSegmentText}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHoveredSegmentText(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded"
                    aria-label={t("Clear")}
                    title={t("Clear")}
                  >
                    ×
                  </button>
                </>
              ) : (
                <span className="text-xs text-gray-400">
                  {t("Tap or hover over a segment to see details")}
                </span>
              )}
            </div>
          )}
          {/* Veri yoksa metin barın altında */}
          {(!sessions || sessions.length === 0) && (
            <p className="order-4 mt-2 text-xs text-gray-400 text-center">
              {emptyText}
            </p>
          )}
          {/* Legend */}
          {sessions &&
            sessions.length > 0 &&
            (() => {
              const seen = new Set<string>();
              const items: {
                userId: string;
                userName: string;
                color: string;
              }[] = [];
              sessions.forEach((session) => {
                const { userId, userName, color } =
                  getSessionDisplayInfo(session);
                if (!userId || seen.has(userId)) return;
                seen.add(userId);
                items.push({
                  userId,
                  userName: userName || String(userId),
                  color,
                });
              });
              if (items.length === 0) return null;
              return (
                <div className="order-4 mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1">
                  {items.map((item) => (
                    <span
                      key={item.userId}
                      className="inline-flex items-center gap-1.5 text-xs text-gray-600"
                    >
                      <span
                        className="w-3 h-3 rounded-sm shrink-0 ring-1 ring-gray-200"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.userName}
                    </span>
                  ))}
                </div>
              );
            })()}
        </div>
      </div>
    </div>
  );
}
