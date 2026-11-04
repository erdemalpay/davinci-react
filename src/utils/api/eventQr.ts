import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { get, patch } from ".";
import {
  EventQrSetting,
  OpenTournament,
  PublicEventQrButton,
} from "../../types/index";
import { Paths } from "./factory";

const baseUrl = Paths.EventQr;
const publicPath = `${baseUrl}/public`;
const openTournamentsPath = `${Paths.Tournaments}/public`;

export type EventQrForm = Omit<EventQrSetting, "_id">;

// Panel: ayarı okur (JWT gerekir); ayar hiç kaydedilmemişse gövde boş gelir
export function useGetEventQr() {
  return useQuery<EventQrSetting | "">({
    queryKey: [baseUrl],
    queryFn: () => get({ path: baseUrl }),
  });
}

export function useSaveEventQr() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: EventQrForm) =>
      patch<EventQrForm, EventQrSetting>({ path: baseUrl, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [baseUrl] });
      queryClient.invalidateQueries({ queryKey: [publicPath] });
      toast.success(t("Saved"));
    },
  });
}

// Herkese açık sayfa (JWT gerekmez): ek buton; yoksa gövde boş gelir
export function useGetPublicEventQrButton() {
  return useQuery<PublicEventQrButton | "">({
    queryKey: [publicPath],
    queryFn: () => get({ path: publicPath }),
    staleTime: 0,
  });
}

export function useGetOpenTournaments() {
  return useQuery<OpenTournament[]>({
    queryKey: [openTournamentsPath],
    queryFn: () => get({ path: openTournamentsPath }),
    staleTime: 0,
  });
}
