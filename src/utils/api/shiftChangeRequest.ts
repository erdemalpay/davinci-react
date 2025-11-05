import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { post } from ".";
import { Paths } from "./factory";

export interface ShiftSnapshotDto {
  shiftId: number;
  day: string;
  startTime: string;
  endTime?: string;
  location?: number;
  chefUser?: string;
  userId: string;
}

export interface CreateShiftChangeRequestDto {
  targetUserId: string;
  requesterShift: ShiftSnapshotDto;
  targetShift: ShiftSnapshotDto;
  type: "SWAP" | "TRANSFER";
  requesterNote: string;
}

function createShiftChangeRequest(payload: CreateShiftChangeRequestDto) {
  return post({
    path: Paths.ShiftChangeRequest,
    payload,
  });
}

export function useCreateShiftChangeRequest() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation(createShiftChangeRequest, {
    onMutate: async () => {
      await queryClient.cancelQueries([Paths.ShiftChangeRequest]);
    },
    onSuccess: () => {
      setTimeout(() => toast.success(t("Shift change request sent successfully")), 200);
      queryClient.invalidateQueries([Paths.Shift]);
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(t(errorMessage)), 200);
    },
  });
}
