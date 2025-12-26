import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { patch, post } from ".";
import { FormElementsState } from "../../types";
import { useGet } from "./factory";

const baseUrl = `/anomaly`;

export enum AnomalyType {
  RAPID_PAYMENTS = "RAPID_PAYMENTS",
  RAPID_GAME_EXPLANATIONS = "RAPID_GAME_EXPLANATIONS",
}

export enum AnomalySeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface Anomaly {
  _id: number;
  user: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  description: string;
  detectedAt: Date;
  incidentDate: Date;
  metadata?: Record<string, any>;
  isReviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface AnomalyQueryDto {
  user?: string;
  type?: AnomalyType;
  severity?: AnomalySeverity;
  date?: string;
  after?: string;
  before?: string;
  page?: number;
  limit?: number;
}

export interface AnomaliesResponse {
  data: Anomaly[];
  totalNumber: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface AnomalyReportDto {
  date: string;
  totalAnomalies: number;
  anomaliesByType: Record<AnomalyType, number>;
  anomaliesBySeverity: Record<AnomalySeverity, number>;
  topUsers: Array<{
    userId: string;
    userName: string;
    anomalyCount: number;
  }>;
}

export function useGetQueryAnomalies(
  page: number,
  limit: number,
  filters: FormElementsState
) {
  const parts = [
    `page=${page}`,
    `limit=${limit}`,
    filters.user && `user=${filters.user}`,
    filters.type && `type=${filters.type}`,
    filters.severity && `severity=${filters.severity}`,
    filters.date && `date=${filters.date}`,
    filters.after && `after=${filters.after}`,
    filters.before && `before=${filters.before}`,
  ];

  const queryString = parts.filter(Boolean).join("&");
  const url = `${baseUrl}?${queryString}`;

  return useGet<AnomaliesResponse>(url, [url, page, limit, filters], true);
}

export function useGetDailyReport(date: string) {
  const url = `${baseUrl}/report/${date}`;
  return useGet<AnomalyReportDto>(url, [url, date], true);
}

export function markAsReviewed(anomalyId: number, reviewedBy: string) {
  return patch({
    path: `${baseUrl}/${anomalyId}/review`,
    payload: { reviewedBy },
  });
}

export function useMarkAsReviewedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      anomalyId,
      reviewedBy,
    }: {
      anomalyId: number;
      reviewedBy: string;
    }) => {
      return await markAsReviewed(anomalyId, reviewedBy);
    },
    onSuccess: () => {
      // Invalidate all anomaly queries
      queryClient.invalidateQueries({ queryKey: [baseUrl] });
      toast.success("Anomaly marked as reviewed");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

// Manual trigger function - can be extended when backend endpoint is available
export function triggerAnomalyCheck() {
  return post({
    path: `${baseUrl}/trigger`,
    payload: {},
  });
}

export function useTriggerAnomalyCheckMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await triggerAnomalyCheck();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [baseUrl] });
      toast.success("Anomaly check triggered successfully");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to trigger anomaly check";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

