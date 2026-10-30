import { format, subDays } from "date-fns";
import { tr } from "date-fns/locale";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/header/Header";
import { useDataContext } from "../context/Data.context";
import {
  Anomaly,
  AnomalySeverity,
  useAnomalyMutations,
  useGetAnomalies,
  useRunAnomaliesMutation,
} from "../utils/api/anomaly";
import { formatCurrency } from "../utils/format";

type Details = Anomaly["details"];

// How each finding reads: a title and a sentence filled from its details.
const anomalyTexts: Record<string, { title: string; text: string }> = {
  CANCELLED_AFTER_PAYMENT: {
    title: "Order cancelled after payment",
    text: "Table {{table}}: an order already paid was cancelled at {{hour}}.",
  },
  DISCOUNTED_AFTER_PAYMENT: {
    title: "Discount after payment",
    text: "Table {{table}}: an order already paid was discounted at {{hour}}.",
  },
  PAYMENT_CANCELLED_AFTER_CLOSING: {
    title: "Payment cancelled after closing",
    text: "Table {{table}} closed at {{closedAt}}; a payment of {{amount}} was cancelled at {{hour}}.",
  },
  NEGATIVE_COLLECTION: {
    title: "Negative payment",
    text: "Table {{table}}: a payment of {{amount}}.",
  },
  CLOSED_TABLE_UNPAID: {
    title: "Table closed unpaid",
    text: "Table {{table}} closed at {{closedAt}} with {{amount}} unpaid.",
  },
  UNUSUAL_DISCOUNTS: {
    title: "Unusual discounts",
    text: "{{amount}} of discounts; usually {{usual}} on a day with discounts.",
  },
  UNUSUAL_CANCELLATIONS: {
    title: "Unusual cancellations",
    text: "{{count}} orders cancelled; usually {{usual}} on a day with cancellations.",
  },
  TABLE_LEFT_OPEN: {
    title: "Table left open",
    text: "Table {{table}}, opened at {{startHour}}, wasn't closed.",
  },
  LONG_OPEN_TABLE: {
    title: "Long open table",
    text: "Table {{table}} was open {{minutes}} minutes ({{startHour}}–{{finishHour}}).",
  },
  TABLE_WITHOUT_ORDERS: {
    title: "Table without orders",
    text: "Table {{table}} was open {{minutes}} minutes ({{startHour}}–{{finishHour}}) without any order.",
  },
  DUPLICATE_OPEN_TABLE: {
    title: "Same table open twice",
    text: "Table {{table}} was opened at {{first}} and again at {{second}} while still open.",
  },
  TABLE_REOPENED: {
    title: "Table reopened",
    text: "Table {{table}} was reopened at {{hour}}.",
  },
  TABLE_DELETED: {
    title: "Table deleted",
    text: "Table {{table}} was deleted at {{hour}}.",
  },
  NO_SHOW: {
    title: "Didn't come",
    text: "On the shift plan ({{shift}}) but didn't check in.",
  },
  UNPLANNED_CHECK_IN: {
    title: "Not on the shift plan",
    text: "Checked in at {{startHour}} without a shift.",
  },
  NOT_CHECKED_OUT: {
    title: "No check-out",
    text: "Checked in at {{startHour}} and never checked out.",
  },
  LATE_CHECK_OUT: {
    title: "Late check-out",
    text: "Checked out at {{finishHour}}, {{minutes}} minutes after the shift.",
  },
  LONG_BREAK: {
    title: "Long break",
    text: "{{breakType}} from {{startHour}} for {{minutes}} minutes.",
  },
  MANY_BREAKS: {
    title: "Many breaks",
    text: "{{count}} breaks in a day.",
  },
  CONCURRENT_BREAKS: {
    title: "Breaks at the same time",
    text: "{{first}} and {{second}} were on a break together from {{from}} for {{minutes}} minutes.",
  },
  VISIT_DELETED: {
    title: "Check-in deleted",
    text: "{{person}}'s check-in was deleted at {{hour}}.",
  },
  LONG_WAITING_CALL: {
    title: "Long waiting call",
    text: "Table {{table}}'s call at {{startHour}} waited {{minutes}} minutes.",
  },
  MANY_DECLINES: {
    title: "Many declined calls",
    text: "{{count}} calls declined.",
  },
  EXPLAINED_UNLEARNED_GAME: {
    title: "Explained a game not learned",
    text: "Explained {{game}} at {{startHour}} without having learned it.",
  },
  NO_MIDDLEMAN: {
    title: "No middleman",
    text: "No middleman all day although there were enough game masters for {{minutes}} minutes.",
  },
  MIDDLEMAN_FLAPPING: {
    title: "Middleman started again and again",
    text: "{{count}} middleman records in a day.",
  },
  NEGATIVE_STOCK: {
    title: "Stock below zero",
    text: "{{product}}'s stock went to {{quantity}}.",
  },
  LARGE_STOCK_EQUALIZE: {
    title: "Large stock correction",
    text: "{{product}}'s stock was corrected by {{change}} ({{value}}).",
  },
  UNUSUAL_WASTE: {
    title: "Unusual waste",
    text: "{{value}} of waste; usually {{usual}} on a day with waste.",
  },
};

const severityClasses: Record<AnomalySeverity, string> = {
  [AnomalySeverity.HIGH]: "bg-red-100 text-red-800",
  [AnomalySeverity.MEDIUM]: "bg-amber-100 text-amber-800",
  [AnomalySeverity.LOW]: "bg-gray-100 text-gray-700",
};
const severityOrder = [
  AnomalySeverity.HIGH,
  AnomalySeverity.MEDIUM,
  AnomalySeverity.LOW,
];
const MONEY_FIELDS = ["amount", "usual", "value"];
const MONEY_TYPES = [
  "PAYMENT_CANCELLED_AFTER_CLOSING",
  "NEGATIVE_COLLECTION",
  "CLOSED_TABLE_UNPAID",
  "UNUSUAL_DISCOUNTS",
  "LARGE_STOCK_EQUALIZE",
  "UNUSUAL_WASTE",
];
const PERSON_FIELDS = ["first", "second", "person"];
const breakTypeLabels: Record<string, string> = {
  BREAK: "Break",
  RECOMMENDING_GAME: "Recommending a game",
  PREPARING_ORDER: "Preparing an order",
  TAKING_PAYMENT: "Taking a payment",
  WC: "WC",
  WAREHOUSE: "Warehouse",
  BAR_CLEANING: "Bar cleaning",
  OTHER: "Other",
};

const yesterday = () => format(subDays(new Date(), 1), "yyyy-MM-dd");

export default function Anomalies() {
  const { t } = useTranslation();
  const { users = [], games = [], storeLocations = [] } = useDataContext();
  const [after, setAfter] = useState(() =>
    format(subDays(new Date(), 7), "yyyy-MM-dd")
  );
  const [before, setBefore] = useState(yesterday);
  const [runDate, setRunDate] = useState(yesterday);
  const [showReviewed, setShowReviewed] = useState(false);
  const anomalies = useGetAnomalies(after, before);
  const { updateAnomaly } = useAnomalyMutations();
  const { mutate: runAnomalies, isPending: isRunning } =
    useRunAnomaliesMutation();

  const nameOf = (id?: string) =>
    users.find((u) => u._id === id)?.name ?? id ?? "";

  const describe = (anomaly: Anomaly) => {
    const texts = anomalyTexts[anomaly.type];
    const values: Details = { ...anomaly.details };
    for (const field of MONEY_FIELDS) {
      if (MONEY_TYPES.includes(anomaly.type) && values[field] !== undefined) {
        values[field] = `${formatCurrency(Number(values[field]))} ₺`;
      }
    }
    for (const field of PERSON_FIELDS) {
      if (values[field]) values[field] = nameOf(String(values[field]));
    }
    if (values.game) {
      values.game =
        games.find((g) => g._id === Number(values.game))?.name ?? values.game;
    }
    if (values.breakType) {
      const breakType = String(values.breakType);
      values.breakType = t(breakTypeLabels[breakType] ?? breakType);
    }
    return {
      title: t(texts?.title ?? anomaly.type),
      text: texts ? t(texts.text, values) : JSON.stringify(anomaly.details),
    };
  };

  // Newest day first; within a day the most serious first.
  const days = useMemo(() => {
    const byDate = new Map<string, Anomaly[]>();
    for (const anomaly of anomalies) {
      if (anomaly.reviewed && !showReviewed) continue;
      byDate.set(anomaly.date, [...(byDate.get(anomaly.date) ?? []), anomaly]);
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, list]) => ({
        date,
        anomalies: [...list].sort(
          (a, b) =>
            severityOrder.indexOf(a.severity) -
              severityOrder.indexOf(b.severity) || a._id - b._id
        ),
      }));
  }, [anomalies, showReviewed]);

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[98%] max-w-5xl mx-auto my-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">{t("Unusual Events")}</h1>
            <p className="text-sm text-gray-500">
              {t(
                "Things that usually don't happen, checked every morning at 06:30 for the day before."
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3 text-sm">
            <label className="flex flex-col gap-1">
              {t("Start Date")}
              <input
                type="date"
                className="border rounded px-2 py-1"
                value={after}
                max={before}
                onChange={(e) => e.target.value && setAfter(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              {t("End Date")}
              <input
                type="date"
                className="border rounded px-2 py-1"
                value={before}
                min={after}
                onChange={(e) => e.target.value && setBefore(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                checked={showReviewed}
                onChange={(e) => setShowReviewed(e.target.checked)}
              />
              {t("Show reviewed")}
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm border rounded-lg bg-white p-3">
          <span>{t("Check a day again")}:</span>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={runDate}
            max={yesterday()}
            onChange={(e) => e.target.value && setRunDate(e.target.value)}
          />
          <button
            className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
            disabled={isRunning}
            onClick={() => runAnomalies(runDate)}
          >
            {isRunning ? t("Checking...") : t("Check")}
          </button>
        </div>

        {days.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            {t("No unusual events in these days")}
          </p>
        )}

        {days.map(({ date, anomalies: list }) => (
          <section
            key={date}
            className="border rounded-lg bg-white overflow-hidden"
          >
            <h2 className="px-4 py-2 bg-gray-50 border-b font-semibold">
              {format(new Date(`${date}T00:00:00`), "d MMMM yyyy, EEEE", {
                locale: tr,
              })}{" "}
              <span className="text-gray-500 font-normal">({list.length})</span>
            </h2>
            <ul className="divide-y">
              {list.map((anomaly) => {
                const { title, text } = describe(anomaly);
                const location = storeLocations.find(
                  (l) => l._id === anomaly.location
                )?.name;
                return (
                  <li
                    key={anomaly._id}
                    className={`flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 ${
                      anomaly.reviewed ? "opacity-60" : ""
                    }`}
                  >
                    <span
                      className={`self-start rounded px-2 py-0.5 text-xs font-medium ${
                        severityClasses[anomaly.severity]
                      }`}
                    >
                      {t(`severity.${anomaly.severity}`)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {title}
                        {anomaly.user && (
                          <span className="font-normal text-gray-600">
                            {" "}
                            – {nameOf(anomaly.user)}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">{text}</p>
                      {location && (
                        <p className="text-xs text-gray-400">{location}</p>
                      )}
                    </div>
                    <label className="flex items-center gap-2 text-sm shrink-0">
                      <input
                        type="checkbox"
                        checked={anomaly.reviewed}
                        onChange={(e) =>
                          updateAnomaly({
                            id: anomaly._id,
                            updates: { reviewed: e.target.checked },
                          })
                        }
                      />
                      {t("Reviewed")}
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
