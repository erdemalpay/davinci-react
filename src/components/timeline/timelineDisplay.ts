import { TFunction } from "i18next";
import { IconType } from "react-icons";
import {
  FiBell,
  FiBookOpen,
  FiClock,
  FiCoffee,
  FiCreditCard,
  FiGrid,
  FiLogIn,
  FiPause,
  FiShoppingBag,
  FiUsers,
} from "react-icons/fi";
import {
  formatDeclineReason,
  gmCallReasonLabels,
} from "../buttonCalls/assignmentDisplay";
import {
  BreakTypeEnum,
  busyStateLabels,
  ButtonCallTypeEnum,
  GmCallReasonEnum,
} from "../../types";
import { getItem } from "../../utils/getItem";
import { TimelineItem } from "../../utils/api/timeline";

// Whose timeline: one person's day, or one table's stay.
export type TimelineView = "person" | "table";

export type TimelineLookups = {
  t: TFunction;
  users: { _id: string; name: string }[];
  games: { _id: number; name: string }[];
  menuItems: { _id: number; name: string }[];
  paymentMethods: { _id: string; name: string }[];
  locations: { _id: number; name: string }[];
};

export type LaneKey =
  | "shift"
  | "visit"
  | "busy"
  | "middleman"
  | "table"
  | "game"
  | "explanation"
  | "call"
  | "order"
  | "payment";

export const LANES: Record<TimelineView, LaneKey[]> = {
  person: [
    "shift",
    "visit",
    "busy",
    "middleman",
    "game",
    "explanation",
    "call",
    "order",
  ],
  table: ["table", "game", "explanation", "call", "order", "payment"],
};

export const laneLabels: Record<LaneKey, string> = {
  shift: "Shift",
  visit: "In the cafe",
  busy: "Break / busy",
  middleman: "Middleman",
  table: "Table",
  game: "Games",
  explanation: "Explaining",
  call: "Calls",
  order: "Orders",
  payment: "Payments",
};

// Cafe days run past midnight: hours before 06:00 belong to the night.
const DAY_ROLLOVER_SECONDS = 6 * 60 * 60;
const ONE_DAY_SECONDS = 24 * 60 * 60;

export function daySeconds(hour?: string) {
  if (!hour) return 0;
  const [h = 0, m = 0, s = 0] = hour.split(":").map(Number);
  const seconds = h * 3600 + m * 60 + s;
  return seconds < DAY_ROLLOVER_SECONDS ? seconds + ONE_DAY_SECONDS : seconds;
}

// "17:18:56" -> "17:18"
export const shortHour = (hour?: string) => (hour ? hour.slice(0, 5) : "");

// 337 -> "5 dk 37 sn", 4320 -> "1 sa 12 dk"
export function formatDuration(seconds: number, t: TFunction) {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  if (hours > 0) return `${hours} ${t("h")} ${minutes} ${t("min")}`;
  if (minutes > 0) {
    return rest > 0 && minutes < 10
      ? `${minutes} ${t("min")} ${rest} ${t("sec")}`
      : `${minutes} ${t("min")}`;
  }
  return `${rest} ${t("sec")}`;
}

export const durationBetween = (start?: string, end?: string) =>
  start && end ? daySeconds(end) - daySeconds(start) : 0;

export function laneOf(item: TimelineItem): LaneKey {
  switch (item.kind) {
    case "shift":
      return "shift";
    case "visit":
      return "visit";
    case "break":
      return "busy";
    case "middleman":
      return "middleman";
    case "gameplay":
      return "game";
    case "explanation":
      return "explanation";
    case "call":
      return "call";
    case "payment":
      return "payment";
    case "tableOpened":
    case "order":
      return "order";
  }
}

const orderColors = {
  created: "bg-sky-500",
  prepared: "bg-amber-500",
  delivered: "bg-green-600",
  cancelled: "bg-red-500",
};

const callColors: Record<string, string> = {
  [ButtonCallTypeEnum.GAMEMASTERCALL]: "bg-blue-600",
  [ButtonCallTypeEnum.ORDERCALL]: "bg-orange-500",
  [ButtonCallTypeEnum.ORDERREADYCALL]: "bg-pink-500",
};

// Tailwind background of the item's bar or dot.
export function colorOf(item: TimelineItem) {
  switch (item.kind) {
    case "shift":
      return "bg-slate-300";
    case "visit":
      return "bg-emerald-400";
    case "break":
      return item.breakType === BreakTypeEnum.BREAK
        ? "bg-amber-400"
        : "bg-yellow-300";
    case "middleman":
      return "bg-teal-500";
    case "gameplay":
      return "bg-indigo-500";
    case "explanation":
      return "bg-violet-400";
    case "call":
      if (item.outcome === "declined") return "bg-red-400";
      if (item.outcome === "takenOver") return "bg-gray-400";
      return callColors[item.callType ?? ""] ?? "bg-blue-600";
    case "order":
      return orderColors[item.orderAction ?? "created"];
    case "payment":
      return item.cancelled ? "bg-gray-400" : "bg-lime-600";
    case "tableOpened":
      return "bg-cyan-500";
  }
}

export function iconOf(item: TimelineItem): IconType {
  switch (item.kind) {
    case "shift":
      return FiClock;
    case "visit":
      return FiLogIn;
    case "break":
      return FiPause;
    case "middleman":
      return FiUsers;
    case "gameplay":
    case "explanation":
      return FiBookOpen;
    case "call":
      return FiBell;
    case "order":
      return item.orderAction === "prepared" ? FiCoffee : FiShoppingBag;
    case "payment":
      return FiCreditCard;
    case "tableOpened":
      return FiGrid;
  }
}

export const callTypeLabel = (type?: string) =>
  type === ButtonCallTypeEnum.ORDERCALL
    ? "Service call"
    : type === ButtonCallTypeEnum.ORDERREADYCALL
    ? "Order Ready Call"
    : "Game master call";

const orderTitles: Record<
  TimelineView,
  Record<NonNullable<TimelineItem["orderAction"]>, string>
> = {
  person: {
    created: "Took an order",
    prepared: "Prepared an order",
    delivered: "Delivered an order",
    cancelled: "Cancelled an order",
  },
  table: {
    created: "Ordered",
    prepared: "Order prepared",
    delivered: "Order delivered",
    cancelled: "Order cancelled",
  },
};

export const outcomeLabels: Record<
  NonNullable<TimelineItem["outcome"]>,
  string
> = {
  handled: "Handled",
  declined: "Declined",
  takenOver: "Taken over by someone else",
  open: "Still open",
  closed: "Closed it (wasn't assigned)",
};

export function makeNames({
  t,
  users,
  games,
  menuItems,
  paymentMethods,
  locations,
}: TimelineLookups) {
  return {
    user: (id?: string) => (id ? getItem(id, users)?.name ?? id : ""),
    game: (id?: number) =>
      id !== undefined ? getItem(id, games)?.name ?? `#${id}` : "",
    menuItem: (id: number) => getItem(id, menuItems)?.name ?? `#${id}`,
    paymentMethod: (id?: string) =>
      id ? t(getItem(id, paymentMethods)?.name ?? id) : "",
    location: (id?: number) =>
      id !== undefined ? getItem(id, locations)?.name ?? "" : "",
  };
}

// The item's headline, e.g. "Game master call · Game explanation".
export function titleOf(
  item: TimelineItem,
  view: TimelineView,
  lookups: TimelineLookups
) {
  const { t } = lookups;
  const names = makeNames(lookups);
  switch (item.kind) {
    case "shift":
      return t("Shift");
    case "visit":
      return t("In the cafe");
    case "break":
      return t(busyStateLabels[item.breakType as BreakTypeEnum] ?? "On break");
    case "middleman":
      return t("Middleman");
    case "tableOpened":
      return t("Opened a table");
    case "gameplay":
      return view === "person"
        ? `${t("Explained a game")}: ${names.game(item.game)}`
        : names.game(item.game);
    case "explanation":
      return view === "person"
        ? t("Explaining a game")
        : `${t("Explaining")}: ${names.user(item.user)}`;
    case "call": {
      const reason = item.gmCallReason
        ? t(gmCallReasonLabels[item.gmCallReason as GmCallReasonEnum])
        : "";
      return [t(callTypeLabel(item.callType)), reason]
        .filter(Boolean)
        .join(" · ");
    }
    case "order":
      return t(orderTitles[view][item.orderAction ?? "created"]);
    case "payment":
      return `${t("Payment")}: ${formatMoney(item.amount)}`;
  }
}

export const formatMoney = (amount = 0) =>
  `${amount.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺`;

export const orderLinesText = (
  item: TimelineItem,
  lookups: TimelineLookups
) => {
  const names = makeNames(lookups);
  return (item.orders ?? [])
    .map((line) => `${line.quantity}× ${names.menuItem(line.item)}`)
    .join(", ");
};

export const declineText = (
  reason: string | undefined,
  note: string | undefined,
  game: number | undefined,
  lookups: TimelineLookups
) =>
  formatDeclineReason(
    { reason: reason as never, note, game },
    lookups.t,
    lookups.games
  );
