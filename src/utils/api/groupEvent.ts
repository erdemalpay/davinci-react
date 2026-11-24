import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { patch } from ".";
import { getApiErrorMessage } from "../getApiErrorMessage";
import { Paths, useGetList } from "./factory";

export enum GroupEventStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export const groupEventStatusLabels: Record<GroupEventStatus, string> = {
  [GroupEventStatus.PENDING]: "Pending",
  [GroupEventStatus.APPROVED]: "Approved",
  [GroupEventStatus.REJECTED]: "Rejected",
  [GroupEventStatus.CANCELLED]: "Cancelled",
};

export const groupEventTypeLabels: Record<string, string> = {
  corporate: "Corporate",
  birthday: "Birthday",
  school_club: "School / Club",
  tournament: "Tournament",
  other: "Other",
};

export type GroupEvent = {
  _id: number;
  organization: string;
  contactName: string;
  phone: string;
  email: string;
  participantCount: number;
  date: string;
  startTime: string;
  endTime: string;
  eventType: string;
  wantsGameMaster?: boolean;
  gamePreferences?: string;
  wantsFood?: boolean;
  foodRequest?: string;
  budgetPerPerson?: number;
  needsInvoice?: boolean;
  invoiceTitle?: string;
  taxOffice?: string;
  taxNumber?: string;
  notes?: string;
  status: GroupEventStatus;
  responseNote?: string;
  decidedBy?: string;
  decidedAt?: string;
  createdAt?: string;
};

const baseUrl = Paths.GroupEvents;

// Applications from davinciboardgame.com; refreshed by the groupEventChanged socket event
export function useGetGroupEvents() {
  return useGetList<GroupEvent>(baseUrl);
}

export function useUpdateGroupEventStatus() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      id: number;
      status: GroupEventStatus;
      responseNote?: string;
      force?: boolean;
    }) =>
      patch<Omit<typeof payload, "id">, GroupEvent & { mailSent: boolean }>({
        path: `${baseUrl}/${payload.id}/status`,
        payload: {
          status: payload.status,
          responseNote: payload.responseNote,
          force: payload.force,
        },
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [baseUrl] });
      const decided =
        result.status === GroupEventStatus.APPROVED ||
        result.status === GroupEventStatus.REJECTED;
      if (decided && !result.mailSent) {
        toast.warning(t("Saved, but the email could not be sent"));
      } else {
        toast.success(t("Saved"));
      }
    },
    onError: (error: unknown) => {
      setTimeout(
        () =>
          toast.error(
            t(getApiErrorMessage(error, "An unexpected error occurred"))
          ),
        200
      );
    },
  });
}
