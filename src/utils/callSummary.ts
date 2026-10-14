import {
  AssignmentActionEnum,
  AssignmentEvent,
  ButtonCallTypeEnum,
  DeclineReasonEnum,
} from "../types";

export type CallSummaryRow = {
  user: string;
  // Given by the system, per call type.
  assigned: Record<AssignedCallType, number>;
  // Took over someone's call, or one nobody had.
  claimed: number;
  // Someone else took over a call they had.
  takenFrom: number;
  declined: number;
  declinesByReason: Record<DeclineReasonEnum, number>;
};

export const ASSIGNED_CALL_TYPES = [
  ButtonCallTypeEnum.GAMEMASTERCALL,
  ButtonCallTypeEnum.ORDERCALL,
  ButtonCallTypeEnum.ORDERREADYCALL,
] as const;

export type AssignedCallType = (typeof ASSIGNED_CALL_TYPES)[number];

const emptyRow = (user: string): CallSummaryRow => ({
  user,
  assigned: {
    [ButtonCallTypeEnum.GAMEMASTERCALL]: 0,
    [ButtonCallTypeEnum.ORDERCALL]: 0,
    [ButtonCallTypeEnum.ORDERREADYCALL]: 0,
  },
  claimed: 0,
  takenFrom: 0,
  declined: 0,
  declinesByReason: Object.fromEntries(
    Object.values(DeclineReasonEnum).map((reason) => [reason, 0])
  ) as Record<DeclineReasonEnum, number>,
});

// Per person: how many calls of each type the system gave them, how many
// they took over or had taken over, and how many they declined and why.
export function summarizeCallsByPerson(
  events: AssignmentEvent[]
): CallSummaryRow[] {
  const rows = new Map<string, CallSummaryRow>();
  const rowOf = (user: string) => {
    const row = rows.get(user) ?? emptyRow(user);
    rows.set(user, row);
    return row;
  };

  for (const event of events) {
    const row = rowOf(event.user);
    if (event.action === AssignmentActionEnum.ASSIGNED) {
      const type = event.callType as AssignedCallType | undefined;
      if (type && type in row.assigned) row.assigned[type] += 1;
    } else if (event.action === AssignmentActionEnum.CLAIMED) {
      row.claimed += 1;
      if (event.fromUser) rowOf(event.fromUser).takenFrom += 1;
    } else if (event.action === AssignmentActionEnum.DECLINED) {
      row.declined += 1;
      const reason = event.reason ?? DeclineReasonEnum.OTHER;
      row.declinesByReason[reason] += 1;
    }
  }
  return [...rows.values()];
}

export const assignedTotal = (row: CallSummaryRow) =>
  ASSIGNED_CALL_TYPES.reduce((sum, type) => sum + row.assigned[type], 0);

// Declines out of the calls they were given or took over.
export function declineRate(row: CallSummaryRow) {
  const received = assignedTotal(row) + row.claimed;
  return received > 0 ? row.declined / received : 0;
}
