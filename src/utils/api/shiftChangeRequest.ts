import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { get, patch, post } from ".";
import {
  PaginatedResponse,
  ShiftChangeRequestType,
  ShiftChangeStatusEnum,
} from "../../types";
import { Paths } from "./factory";

export interface ShiftSnapshotDto {
  shiftId: number;
  day: string;
  startTime: string;
  endTime?: string;
  location: number;
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

  return useMutation({
    mutationFn: createShiftChangeRequest,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [Paths.ShiftChangeRequest] });
    },
    onSuccess: () => {
      setTimeout(
        () => toast.success(t("Shift change request sent successfully")),
        200
      );
      queryClient.invalidateQueries({ queryKey: [Paths.Shift] });
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(t(errorMessage)), 200);
    },
  });
}

// -------------------- Management (List / Approve / Reject) --------------------

function buildQuery(params: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v)) v.forEach((vv) => sp.append(k, String(vv)));
    else sp.append(k, String(v));
  });
  const q = sp.toString();
  return q ? `${Paths.ShiftChangeRequest}?${q}` : Paths.ShiftChangeRequest;
}

export function useGetShiftChangeRequests(params: {
  status?: ShiftChangeStatusEnum | ShiftChangeStatusEnum[];
  requesterId?: string;
  targetUserId?: string;
  after?: string;
  before?: string;
  page?: number;
  limit?: number;
}) {
  const path = buildQuery(params || {});
  return useQuery<PaginatedResponse<ShiftChangeRequestType>>({
    queryKey: [path],
    queryFn: () => get<PaginatedResponse<ShiftChangeRequestType>>({ path }),
    staleTime: 0,
  });
}

export function useGetMyShiftChangeRequests(params?: {
  status?: ShiftChangeStatusEnum | ShiftChangeStatusEnum[];
  after?: string;
  before?: string;
  page?: number;
  limit?: number;
}) {
  const buildMyRequestsQuery = () => {
    const sp = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") return;
        if (Array.isArray(v)) v.forEach((vv) => sp.append(k, String(vv)));
        else sp.append(k, String(v));
      });
    }
    const q = sp.toString();
    return q ? `${Paths.ShiftChangeRequest}/my-requests?${q}` : `${Paths.ShiftChangeRequest}/my-requests`;
  };

  const path = buildMyRequestsQuery();
  return useQuery<PaginatedResponse<ShiftChangeRequestType>>({
    queryKey: [path],
    queryFn: () => get<PaginatedResponse<ShiftChangeRequestType>>({ path }),
    staleTime: 0,
  });
}

// Manager approve
export function useManagerApproveShiftChangeRequest() {
  const client = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, managerNote }: { id: number; managerNote?: string }) =>
      patch({
        path: `${Paths.ShiftChangeRequest}/${id}/manager-approve`,
        payload: { managerNote },
      }),
    onSuccess: () => {
      setTimeout(() => toast.success(t("Request approved")), 200);
      client.invalidateQueries({ queryKey: [Paths.ShiftChangeRequest] });
      client.invalidateQueries({ queryKey: [Paths.Shift] });
    },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message || "An unexpected error occurred";
        setTimeout(() => toast.error(t(msg)), 200);
      },
    }
  );
}

// Manager reject
export function useManagerRejectShiftChangeRequest() {
  const client = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, managerNote }: { id: number; managerNote?: string }) =>
      patch({
        path: `${Paths.ShiftChangeRequest}/${id}/manager-reject`,
        payload: { managerNote },
      }),
    onSuccess: () => {
      setTimeout(() => toast.warning(t("Request rejected")), 200);
      client.invalidateQueries({ queryKey: [Paths.ShiftChangeRequest] });
    },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message || "An unexpected error occurred";
        setTimeout(() => toast.error(t(msg)), 200);
      },
    }
  );
}

// Target user approve
export function useTargetApproveShiftChangeRequest() {
  const client = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      patch({
        path: `${Paths.ShiftChangeRequest}/${id}/target-approve`,
        payload: {},
      }),
    onSuccess: () => {
      setTimeout(() => toast.success(t("Request approved")), 200);
      client.invalidateQueries({ queryKey: [Paths.ShiftChangeRequest] });
      client.invalidateQueries({ queryKey: [Paths.Shift] });
    },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message || "An unexpected error occurred";
        setTimeout(() => toast.error(t(msg)), 200);
      },
    }
  );
}

// Target user reject
export function useTargetRejectShiftChangeRequest() {
  const client = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, managerNote }: { id: number; managerNote?: string }) =>
      patch({
        path: `${Paths.ShiftChangeRequest}/${id}/target-reject`,
        payload: { managerNote },
      }),
    onSuccess: () => {
      setTimeout(() => toast.warning(t("Request rejected")), 200);
      client.invalidateQueries({ queryKey: [Paths.ShiftChangeRequest] });
    },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message || "An unexpected error occurred";
        setTimeout(() => toast.error(t(msg)), 200);
      },
    }
  );
}

// Requester cancel
export function useCancelShiftChangeRequest() {
  const client = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      patch({
        path: `${Paths.ShiftChangeRequest}/${id}/cancel`,
        payload: {},
      }),
    onSuccess: () => {
      setTimeout(() => toast.success(t("Request cancelled")), 200);
      client.invalidateQueries({ queryKey: [Paths.ShiftChangeRequest] });
      client.invalidateQueries({ queryKey: [Paths.Shift] });
    },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message || "An unexpected error occurred";
        setTimeout(() => toast.error(t(msg)), 200);
      },
    }
  );
}

// Backward compatibility (optional - eski hook'ları kullanıyorsan)
export const useApproveShiftChangeRequest = useManagerApproveShiftChangeRequest;
export const useRejectShiftChangeRequest = useManagerRejectShiftChangeRequest;
