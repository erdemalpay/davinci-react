import { AssignmentStep } from "../../components/buttonCalls/assignmentDisplay";
import { Paths, useGet, useGetList } from "./factory";

export type TimelineKind =
  | "shift"
  | "visit"
  | "break"
  | "middleman"
  | "tableOpened"
  | "gameplay"
  | "explanation"
  | "call"
  | "order"
  | "payment";

export type TimelineOrderAction =
  | "created"
  | "prepared"
  | "delivered"
  | "cancelled";

export type TimelineCallOutcome =
  | "handled"
  | "declined"
  | "takenOver"
  | "open"
  | "closed";

export type TimelineCallHistoryEntry = {
  user: string;
  action: string;
  hour: string;
  reason?: string;
  note?: string;
  game?: number;
  fromUser?: string;
};

export type TimelineOrderLine = {
  order: number;
  item: number;
  quantity: number;
  status: string;
  kitchen?: string;
};

// One thing on a timeline, in cafe time ("HH:mm:ss"); `end` for things that
// last.
export type TimelineItem = {
  kind: TimelineKind;
  start: string;
  end?: string;
  location?: number;
  table?: number;
  tableName?: string;
  user?: string;
  game?: number;
  playerCount?: number;
  isServiceStaff?: boolean;
  isMiddleman?: boolean;
  isOutsideOperation?: boolean;
  breakType?: string;
  note?: string;
  callId?: number;
  callType?: string;
  gmCallReason?: string;
  callStart?: string;
  callEnd?: string;
  closedBy?: string;
  outcome?: TimelineCallOutcome;
  declineReason?: string;
  history?: TimelineCallHistoryEntry[];
  orderAction?: TimelineOrderAction;
  orders?: TimelineOrderLine[];
  amount?: number;
  paymentMethod?: string;
  cancelled?: boolean;
  cancelledBy?: string;
};

export type UserTimeline = {
  user: string;
  date: string;
  items: TimelineItem[];
};

export type TableTimeline = {
  table: {
    _id: number;
    name: string;
    date: string;
    location: number;
    startHour: string;
    finishHour?: string;
    playerCount: number;
    type?: string;
    createdBy?: string;
  };
  items: TimelineItem[];
};

export function useGetUserTimeline(user: string, date: string) {
  return useGet<UserTimeline>(
    `${Paths.Timeline}/user?user=${encodeURIComponent(user)}&date=${date}`,
    [Paths.Timeline, "user", user, date],
    true,
    { enabled: !!user && !!date }
  );
}

export function useGetTableTimeline(table?: number) {
  return useGet<TableTimeline>(
    `${Paths.Timeline}/table?table=${table}`,
    [Paths.Timeline, "table", table],
    true,
    { enabled: !!table }
  );
}

export type LoadPoint = {
  hour: string;
  gmCalls: number;
  serviceCalls: number;
  orderReadyCalls: number;
  waitingCalls: number;
  waitingGmCalls: number;
  waitingServiceCalls: number;
  waitingOrderReadyCalls: number;
  tables: number;
  customers: number;
  preparingOrders: number;
  staffInCafe: number;
  freeStaff: number;
  call: number;
  explaining: number;
  middleman: number;
  break: number;
  otherBusy: number;
  // Who is free and who is busy with what (user ids).
  people?: Partial<Record<string, string[]>>;
};

export function useGetDayLoad(location: number, date: string) {
  return useGetList<LoadPoint>(
    `${Paths.Timeline}/load?location=${location}&date=${date}`,
    [Paths.Timeline, "load", location, date],
    true,
    { enabled: !!location && !!date }
  );
}

// Why a call had nobody at a moment (see the API's timeline.waiting.ts).
export type WaitingReason =
  | "nobodyInCafe"
  | "allBusy"
  | "otherRoleFree"
  | "declined"
  | "upstairsDuty"
  | "gameUnknown"
  | "notAssigned";

export type WaitingCall = {
  callId: number;
  callType: string;
  gmCallReason?: string;
  game?: number;
  tableName: string;
  table?: number;
  start: string;
  end?: string;
  assignedTo?: string;
  closedBy?: string;
  // Seconds without anyone.
  waited: number;
  segments: {
    start: string;
    end: string;
    reason: WaitingReason;
    // Who was free among the people the reason is about.
    free: string[];
  }[];
  // Assignments, declines and take-overs, in order.
  events: AssignmentStep[];
};

export function useGetWaitingCalls(location: number, date: string) {
  return useGetList<WaitingCall>(
    `${Paths.Timeline}/waiting-calls?location=${location}&date=${date}`,
    [Paths.Timeline, "waiting-calls", location, date],
    true,
    { enabled: !!location && !!date }
  );
}
