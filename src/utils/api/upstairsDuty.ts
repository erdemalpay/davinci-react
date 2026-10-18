import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { post } from ".";
import { UpstairsDuty } from "../../types";
import { Paths, useGet } from "./factory";

// The day's upstairs duties at a location, oldest first.
export const useGetUpstairsDuties = (location: number, date: string) =>
  useGet<UpstairsDuty[]>(
    `${Paths.UpstairsDuty}?date=${date}&location=${location}`,
    [Paths.UpstairsDuty, location, date],
    true,
    { enabled: !!location }
  );

// Takes the upstairs duty over from whoever has it now.
export function useTakeUpstairsDutyMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (location: number) =>
      post<{ location: number }, UpstairsDuty>({
        path: `${Paths.ButtonCalls}/upstairs-duty/take`,
        payload: { location },
      }),
    onError: (err: AxiosError<{ message?: string }>) => {
      const errorMessage =
        err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(t(errorMessage)), 200);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [Paths.UpstairsDuty] });
    },
  });
}
