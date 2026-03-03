import {
  addDays,
  format,
  formatDate,
  isToday,
  isValid,
  parse,
  subDays,
} from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { ActionMeta, MultiValue, SingleValue } from "react-select";
import SummaryCard from "../components/common/SummaryCard";
import { Header } from "../components/header/Header";
import SelectInput from "../components/panelComponents/FormElements/SelectInput";
import TextInput from "../components/panelComponents/FormElements/TextInput";
import { InputTypes } from "../components/panelComponents/shared/types";
import { ActiveVisitList } from "../components/tables/ActiveVisitList";
import { PreviousVisitList } from "../components/tables/PreviousVisitList";
import { useFilterContext } from "../context/Filter.context";
import { OptionType } from "../types";
import { useGetStoreLocations } from "../utils/api/location";
import { useGetMenuItems } from "../utils/api/menu/menu-item";
import { useGetMiddlemanByDate } from "../utils/api/middleman";
import { useGetDailySummary } from "../utils/api/order/order";
import { useGetUsers, useGetUsersMinimal } from "../utils/api/user";
import { useGetGivenDateLocationVisits } from "../utils/api/visit";
import { getItem } from "../utils/getItem";

const DailySummary = () => {
  const { t } = useTranslation();
  const {
    filterDailySummaryPanelFormElements,
    setFilterDailySummaryPanelFormElements,
  } = useFilterContext();
  const visits = useGetGivenDateLocationVisits(
    filterDailySummaryPanelFormElements.date,
    filterDailySummaryPanelFormElements.location
  );
  const locations = useGetStoreLocations();
  const items = useGetMenuItems();
  const users = useGetUsers();
  const usersMinimal = useGetUsersMinimal();
  const [componentKey, setComponentKey] = useState(0);
  const [hoveredSegmentText, setHoveredSegmentText] = useState<string | null>(
    null
  );
  const DATE_FMT = "yyyy-MM-dd";

  const strToDate = (s?: string) => {
    if (!s) return new Date();
    const d = parse(s, DATE_FMT, new Date());
    return isValid(d) ? d : new Date();
  };

  const dateToStr = (d: Date) => formatDate(d, DATE_FMT);

  const selectedDate = filterDailySummaryPanelFormElements.date as string;
  const middlemanSessions = useGetMiddlemanByDate(selectedDate || "");

  // Gece yarısını aşan saatler için (00:xx, 01:xx ...) +1440 ekle
  const timeToMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    const total = h * 60 + m;
    // 06:00'dan önce = gece yarısını geçmiş (ertesi gün sabahı)
    return total < 6 * 60 ? total + 24 * 60 : total;
  };

  // Sabit aralık: 12:00 (720dk) → 00:20 (1460dk)
  const BAR_START_MINUTES = 12 * 60; // 720
  const BAR_END_MINUTES = 24 * 60 + 20; // 1460
  const BAR_TOTAL_MINUTES = BAR_END_MINUTES - BAR_START_MINUTES; // 740

  // Saat işaretleri: 12, 14, 16, 18, 20, 22 (sağ uçta sadece 00:20 ayrı gösterilir, 00:00 yok)
  const TIMELINE_TICKS = [
    { label: "12:00", minutes: 12 * 60 },
    { label: "14:00", minutes: 14 * 60 },
    { label: "16:00", minutes: 16 * 60 },
    { label: "18:00", minutes: 18 * 60 },
    { label: "20:00", minutes: 20 * 60 },
    { label: "22:00", minutes: 22 * 60 },
    { label: "00:00", minutes: 24 * 60 }, // sadece bar içi çizgi için (etiket göstermiyoruz)
  ];
  const TICK_LABELS = TIMELINE_TICKS.slice(0, -1); // 00:00 hariç etiketler (sağda 00:20 var)

  const hashUserId = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 31 + id.charCodeAt(i)) & 0x7fffffff;
    }
    return hash;
  };

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

  const getUserColor = (userId: string) =>
    PALETTE[hashUserId(userId) % PALETTE.length];

  const getSessionDisplayInfo = (session: {
    user: string | { _id?: string; name?: string };
    startHour?: string;
    finishHour?: string;
  }) => {
    const userId =
      typeof session.user === "string"
        ? session.user
        : (session.user as { _id?: string })?._id;
    const userName =
      getItem(userId, usersMinimal)?.name ||
      (typeof session.user === "object"
        ? (session.user as { name?: string })?.name
        : userId);
    const color = getUserColor(userId ?? "");
    const tooltipText = session.startHour
      ? session.finishHour
        ? `${userName}: ${session.startHour} – ${session.finishHour}`
        : `${userName}: ${session.startHour} – ${t("ongoing")}`
      : undefined;
    return { userId, userName: userName ?? userId, color, tooltipText };
  };

  const summary = useGetDailySummary(
    filterDailySummaryPanelFormElements.date,
    filterDailySummaryPanelFormElements.location
  );

  const metricCards = [
    {
      header: t("Average Preparation Time"),
      rows: [
        {
          value: summary?.orderPreparationStats?.average?.formatted || "-",
        },
      ],
      headerBgColor: "#DBEAFE",
      headerTextColor: "#1E40AF",
      valueColor: "#1E40AF",
      variant: "metric" as const,
    },
    {
      header: t("Average Button Call Time"),
      rows: [
        {
          value: summary?.buttonCallStats?.averageDuration || "-",
        },
      ],
      headerBgColor: "#E9D5FF",
      headerTextColor: "#7C3AED",
      valueColor: "#7C3AED",
      variant: "metric" as const,
    },
  ];

  const rankingCards = [
    {
      header: t("Top Order Creators"),
      rows:
        summary?.topOrderCreators.map((creator) => ({
          title: creator.userName,
          value: creator.orderCount,
          bgColor: getItem(creator.userId, users)?.role?.color,
        })) ?? [],
      headerBgColor: "#D1FAE5",
      headerTextColor: "#065F46",
      variant: "ranking" as const,
      showRankEmojis: true,
    },
    {
      header: t("Top Order Deliverers"),
      rows:
        summary?.topOrderDeliverers.map((deliverer) => ({
          title: deliverer.userName,
          value: deliverer.orderCount,
          bgColor: getItem(deliverer.userId, users)?.role?.color,
        })) ?? [],
      headerBgColor: "#DBEAFE",
      headerTextColor: "#1E40AF",
      variant: "ranking" as const,
      showRankEmojis: true,
    },
    {
      header: t("Top Collection Creators"),
      rows:
        summary?.topCollectionCreators.map((creator) => ({
          title: creator.userName,
          value: creator.collectionCount,
          bgColor: getItem(creator.userId, users)?.role?.color,
        })) ?? [],
      headerBgColor: "#FED7AA",
      headerTextColor: "#9A3412",
      variant: "ranking" as const,
      showRankEmojis: true,
    },
    {
      header: t("Top 3 Mentors"),
      rows:
        summary?.gameplayStats?.topMentors?.map((o) => ({
          title: getItem(o?.mentoredBy, users)?.name || "-",
          value: o.gameplayCount,
          bgColor: getItem(o?.mentoredBy, users)?.role?.color,
        })) ?? [],
      headerBgColor: "#E9D5FF",
      headerTextColor: "#6B21A8",
      variant: "ranking" as const,
      showRankEmojis: true,
    },
  ];

  const detailCards = [
    {
      header: t("Longest Order Preparation Times"),
      rows:
        summary?.orderPreparationStats?.topOrders?.map((o) => ({
          title: getItem(o?.order?.item, items)?.name || "-",
          value: o?.formatted?.replace(/^00:/, "") || "-",
          subtitle:
            `${t("Table")}: ${o?.order?.orderTable?.name}` +
            (o?.order?.deliveredAt
              ? ` • ${format(o?.order?.deliveredAt, "HH:mm")}`
              : ""),
        })) ?? [],
      headerBgColor: "#FEE2E2",
      headerTextColor: "#991B1B",
      valueColor: "#DC2626",
      variant: "detail" as const,
    },
    {
      header: t("Longest Button Call Times"),
      rows:
        summary?.buttonCallStats?.longestCalls?.map((o) => ({
          title: `${t("Table")}: ${o.tableName}`,
          value: o.duration,
          subtitle: o?.finishHour,
        })) ?? [],
      headerBgColor: "#E0E7FF",
      headerTextColor: "#3730A3",
      valueColor: "#4F46E5",
      variant: "detail" as const,
    },
    {
      header: t("Top Complex Games"),
      rows:
        summary?.gameplayStats?.topComplexGames?.map((o) => ({
          title: o.name,
          value:
            o?.mentors
              ?.map((mentor) => getItem(mentor, users)?.name)
              ?.join(", ") || "-",
        })) ?? [],
      headerBgColor: "#FCE7F3",
      headerTextColor: "#831843",
      valueColor: "#1F2937",
      variant: "detail" as const,
    },
  ];
  const filterInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "location",
      label: t("Location"),
      options: locations.map((input) => {
        return {
          value: input._id,
          label: input.name,
        };
      }),
      placeholder: t("Location"),
      required: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "date",
      // label: t("Date"),
      placeholder: t("Date"),
      required: true,
      isDatePicker: true,
    },
  ];
  const handleChange = (key: string) => (value: string) => {
    setFilterDailySummaryPanelFormElements(
      (prev: Record<string, string | number>) => ({
        ...prev,
        [key]: value,
      })
    );
  };

  const handleChangeForSelect =
    (key: string) =>
    (
      selectedValue: SingleValue<OptionType> | MultiValue<OptionType>,
      actionMeta: ActionMeta<OptionType>
    ) => {
      if (
        actionMeta.action === "select-option" ||
        actionMeta.action === "remove-value" ||
        actionMeta.action === "clear"
      ) {
        if (selectedValue) {
          setFilterDailySummaryPanelFormElements(
            (prev: Record<string, string | number>) => ({
              ...prev,
              [key]: (selectedValue as OptionType)?.value,
            })
          );
        } else {
          setFilterDailySummaryPanelFormElements(
            (prev: Record<string, string | number>) => ({
              ...prev,
              [key]: "",
            })
          );
        }
      }
    };
  useEffect(() => {
    setComponentKey((prev) => prev + 1);
  }, [locations, items, users, summary, visits]);
  return (
    <>
      <Header showLocationSelector={false} />
      <div key={componentKey} className="w-full px-4 flex flex-col gap-4 my-10">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* who is/was at the cafe */}
          {filterDailySummaryPanelFormElements.date &&
          isToday(filterDailySummaryPanelFormElements.date) ? (
            <ActiveVisitList
              name="employees"
              label={t("Who's at cafe?")}
              visits={visits}
            />
          ) : (
            <PreviousVisitList visits={visits} isLabel={false} />
          )}
          {/* filter */}
          <div className="w-full sm:w-1/2 grid grid-cols-1 sm:flex sm:flex-row gap-4 sm:ml-auto items-center   ">
            {filterInputs.map((input) => {
              if (input.type === InputTypes.DATE) {
                return (
                  <div
                    key={input.formKey}
                    className="w-full flex items-center gap-2"
                  >
                    {/* left arrow */}
                    <button
                      type="button"
                      className="p-2 rounded bg-gray-100 hover:bg-gray-200 mt-auto min-h-11"
                      onClick={() => {
                        setFilterDailySummaryPanelFormElements(
                          (prev: Record<string, string | number>) => {
                            const cur = prev[input.formKey] as
                              | string
                              | undefined;
                            const next = subDays(strToDate(cur), 1);
                            return {
                              ...prev,
                              [input.formKey]: dateToStr(next),
                            };
                          }
                        );
                      }}
                    >
                      <IoIosArrowBack size={20} />
                    </button>

                    {/* date picker input */}
                    <TextInput
                      key={input.formKey}
                      type={input.type}
                      value={
                        filterDailySummaryPanelFormElements[input.formKey] ?? ""
                      }
                      label={input.label ?? ""}
                      isDatePickerLabel={false}
                      placeholder={input.placeholder ?? ""}
                      onChange={handleChange(input.formKey)}
                      isDatePicker={input?.isDatePicker ?? false}
                    />

                    {/* right arrow */}
                    <button
                      type="button"
                      className="p-2 rounded bg-gray-100 hover:bg-gray-200 mt-auto min-h-11"
                      onClick={() => {
                        setFilterDailySummaryPanelFormElements(
                          (prev: Record<string, string | number>) => {
                            const cur = prev[input.formKey] as
                              | string
                              | undefined;
                            const next = addDays(strToDate(cur), 1);
                            return {
                              ...prev,
                              [input.formKey]: dateToStr(next),
                            };
                          }
                        );
                      }}
                    >
                      <IoIosArrowForward size={20} />
                    </button>
                  </div>
                );
              } else if (input.type === InputTypes.SELECT) {
                const selectedValue = input.options?.find(
                  (option) =>
                    option.value ===
                    filterDailySummaryPanelFormElements[input.formKey]
                );
                return (
                  <div key={input.formKey} className="w-full ">
                    <SelectInput
                      key={input.formKey}
                      value={selectedValue || null}
                      options={input.options ?? []}
                      placeholder={input.placeholder ?? ""}
                      onChange={handleChangeForSelect(input.formKey)}
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {metricCards.map((card, index) => (
              <SummaryCard key={index} {...card} />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rankingCards.map((card, index) => (
              <SummaryCard key={index} {...card} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {detailCards.map((card, index) => (
              <SummaryCard key={index} {...card} />
            ))}
          </div>

          {/* Middleman Timeline - responsive, tooltip bar alanında kalır */}
          {selectedDate && (
            <div className="bg-white rounded-xl shadow p-4 overflow-visible">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {t("Middleman Timeline")}
              </h3>
              <div className="overflow-x-auto overflow-y-visible pb-1 -mx-1">
                <div className="min-w-[280px] w-full flex flex-col">
                  {/* Saat işaretleri - sadece masaüstünde (mobilde liste kullanılıyor) */}
                  <div className="order-1 hidden sm:block relative w-full min-h-[1.75rem] text-xs text-gray-500 mb-1.5">
                    {TICK_LABELS.map((tick) => {
                      const tickMin =
                        tick.minutes >= 12 * 60
                          ? tick.minutes
                          : tick.minutes + 24 * 60;
                      const pct =
                        ((Math.min(tickMin, BAR_END_MINUTES) -
                          BAR_START_MINUTES) /
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
                    <span className="absolute whitespace-nowrap right-0">
                      00:20
                    </span>
                  </div>
                  {/* Bar - sadece masaüstünde; mobilde liste gösteriliyor */}
                  <div className="order-3 sm:order-2 hidden sm:block relative w-full h-8 sm:h-6 bg-gray-100 rounded-lg overflow-visible border border-gray-200">
                    {/* İçteki saat çizgileri */}
                    {TIMELINE_TICKS.slice(1).map((tick) => {
                      const tickMin =
                        tick.minutes >= 12 * 60
                          ? tick.minutes
                          : tick.minutes + 24 * 60;
                      const pct =
                        ((Math.min(tickMin, BAR_END_MINUTES) -
                          BAR_START_MINUTES) /
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
                    {middlemanSessions && middlemanSessions.length > 0
                      ? middlemanSessions.map((session) => {
                          if (!session.startHour) return null;

                          const startMin = timeToMinutes(session.startHour);
                          const nowMin = isToday(strToDate(selectedDate))
                            ? timeToMinutes(format(new Date(), "HH:mm"))
                            : BAR_END_MINUTES;
                          const endMin = session.finishHour
                            ? timeToMinutes(session.finishHour)
                            : nowMin;

                          const clampedStart = Math.max(
                            startMin,
                            BAR_START_MINUTES
                          );
                          const clampedEnd = Math.min(endMin, BAR_END_MINUTES);

                          if (clampedEnd <= clampedStart) return null;

                          const leftPct =
                            ((clampedStart - BAR_START_MINUTES) /
                              BAR_TOTAL_MINUTES) *
                            100;
                          const widthPct =
                            ((clampedEnd - clampedStart) / BAR_TOTAL_MINUTES) *
                            100;

                          const { color, tooltipText } =
                            getSessionDisplayInfo(session);
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
                              onMouseEnter={() =>
                                setHoveredSegmentText(tooltipText)
                              }
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
                  {middlemanSessions && middlemanSessions.length > 0 && (
                    <div className="order-3 sm:order-2 block sm:hidden mt-1">
                      <ul className="space-y-2">
                        {middlemanSessions.map((session) => {
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
                                  setHoveredSegmentText(
                                    isSelected ? null : tooltipText
                                  )
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
                  {middlemanSessions && middlemanSessions.length > 0 && (
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
                  {(!middlemanSessions || middlemanSessions.length === 0) && (
                    <p className="order-4 mt-2 text-xs text-gray-400 text-center">
                      {t("No middleman sessions")}
                    </p>
                  )}
                  {/* Legend */}
                  {middlemanSessions &&
                    middlemanSessions.length > 0 &&
                    (() => {
                      const seen = new Set<string>();
                      const items: {
                        userId: string;
                        userName: string;
                        color: string;
                      }[] = [];
                      middlemanSessions.forEach((session) => {
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
          )}
        </div>
      </div>
    </>
  );
};

export default DailySummary;
