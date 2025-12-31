import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { post } from "..";
import { PanelSettings } from "../../../types";
import { Paths, useGet } from "../factory";

const baseUrl = `${Paths.PanelControl}/panel-settings`;
export function createPanelSettings(
  settings: Partial<PanelSettings>
): Promise<PanelSettings> {
  return post<Partial<PanelSettings>, PanelSettings>({
    path: baseUrl,
    payload: settings,
  });
}

export function resetRedis() {
  return post({
    path: `${Paths.Redis}/clear-cache`,
    payload: {},
  });
}
export function useResetRedisMutation() {
  const queryKey = [`${Paths.Redis}/clear-cache`];
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetRedis,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
    },

    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export function useCreateMultiplePageMutation() {
  const queryKey = [baseUrl];
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPanelSettings,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
    },

    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export function useGetPanelSettings() {
  return useGet<PanelSettings>(baseUrl);
}
