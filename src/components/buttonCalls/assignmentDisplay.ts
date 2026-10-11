import { TFunction } from "i18next";
import {
  AssignmentActionEnum,
  AssignmentHistoryItem,
  DeclineReasonEnum,
  declineReasonLabels,
  GmCallReasonEnum,
} from "../../types";

export const assignmentActionLabels: Record<AssignmentActionEnum, string> = {
  [AssignmentActionEnum.ASSIGNED]: "Assigned by the system",
  [AssignmentActionEnum.DECLINED]: "Declined",
  [AssignmentActionEnum.CLAIMED]: "Took over",
};

export const assignmentActionColors: Record<AssignmentActionEnum, string> = {
  [AssignmentActionEnum.ASSIGNED]: "bg-gray-500",
  [AssignmentActionEnum.DECLINED]: "bg-red-500",
  [AssignmentActionEnum.CLAIMED]: "bg-blue-500",
};

export const gmCallReasonLabels: Record<GmCallReasonEnum, string> = {
  [GmCallReasonEnum.RECOMMENDATION]: "Game recommendation",
  [GmCallReasonEnum.EXPLANATION]: "Game explanation",
  [GmCallReasonEnum.QUESTION]: "Question about the game",
};

export type AssignmentStep = AssignmentHistoryItem & {
  // For a take-over: who had the call before.
  fromUser?: string;
};

// A call's assignment history in order, with who each take-over was from.
export function toAssignmentSteps(
  history: AssignmentHistoryItem[] = []
): AssignmentStep[] {
  let current: string | undefined;
  return history.map((entry) => {
    const step: AssignmentStep = { ...entry };
    if (entry.action === AssignmentActionEnum.CLAIMED && current) {
      step.fromUser = current;
    }
    current =
      entry.action === AssignmentActionEnum.DECLINED ? undefined : entry.user;
    return step;
  });
}

// Whether the call went through more than one person.
export const hadSeveralAssignees = (history: AssignmentHistoryItem[] = []) =>
  new Set(history.map((entry) => entry.user)).size > 1;

// "Other: <note>" and "I don't know the game: <game>"; just the reason
// otherwise.
export function formatDeclineReason(
  step: Pick<AssignmentHistoryItem, "reason" | "note" | "game">,
  t: TFunction,
  games: { _id: number; name: string }[]
) {
  if (!step.reason) return "";
  const label = t(declineReasonLabels[step.reason]);
  if (step.reason === DeclineReasonEnum.OTHER && step.note) {
    return `${label}: ${step.note}`;
  }
  if (step.reason === DeclineReasonEnum.DOESNT_KNOW_GAME && step.game) {
    const gameName = games.find((g) => g._id === step.game)?.name;
    return gameName ? `${label}: ${gameName}` : label;
  }
  return label;
}
