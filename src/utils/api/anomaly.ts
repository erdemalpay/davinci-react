import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { post } from ".";
import { getApiErrorMessage } from "../getApiErrorMessage";
import { Paths, useGetList, useMutationApi } from "./factory";

export enum AnomalySeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

// Something that happened on a cafe day that usually doesn't, found by the
// daily anomaly report (run at 06:30 for the day before).
export type Anomaly = {
  _id: number;
  date: string;
  type: string;
  severity: AnomalySeverity;
  location?: number;
  user?: string;
  key: string;
  details: Record<string, string | number | boolean | undefined>;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
};

const baseUrl = Paths.Anomalies;

export function useGetAnomalies(after: string, before: string) {
  return useGetList<Anomaly>(
    `${baseUrl}?after=${after}&before=${before}`,
    [baseUrl, after, before],
    true
  );
}

// Updates the list the page shows (same range), so a change shows at once.
export function useAnomalyMutations(after: string, before: string) {
  const { updateItem: updateAnomaly } = useMutationApi<Anomaly>({
    baseQuery: baseUrl,
    queryKey: [baseUrl, after, before],
  });
  return { updateAnomaly };
}

// Checks a past day again.
export function useRunAnomaliesMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (date: string) =>
      post<{ date: string }, Anomaly[]>({
        path: `${baseUrl}/run`,
        payload: { date },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [baseUrl] }),
    onError: (err) =>
      toast.error(t(getApiErrorMessage(err, "An unexpected error occurred"))),
  });
}
