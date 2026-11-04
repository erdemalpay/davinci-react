import { EventQrSetting } from "../../types/index";
import { Tournament } from "../../types/tournament";
import { Paths, useGet, useMutationApi } from "./factory";

const latestPath = `${Paths.EventQr}/latest`;

export type EventQrForm = Omit<EventQrSetting, "_id">;

export function useEventQrMutations() {
  const { createItem: createEventQr, updateItem: updateEventQr } =
    useMutationApi<EventQrSetting>({
      baseQuery: Paths.EventQr,
      isAdditionalInvalidate: true,
      additionalInvalidates: [[latestPath]],
    });
  return { createEventQr, updateEventQr };
}

// Panel: yüklenirken undefined; en yeni kayıt ilk sıradadır
export function useGetEventQrs() {
  return useGet<EventQrSetting[]>(Paths.EventQr);
}

// Kasadaki QR'ın açtığı herkese açık sayfa (giriş yok, bu yüzden enabled: true);
// yüklenirken undefined, ek buton yoksa gövde boş gelir
export function useGetPublicEventQrButton() {
  return useGet<Pick<EventQrSetting, "title" | "url"> | "">(
    latestPath,
    [latestPath],
    true,
    { enabled: true }
  );
}

// Kaydı açık turnuvalar
export function useGetOpenTournaments() {
  const path = `${Paths.Tournaments}/public`;
  return useGet<Pick<Tournament, "_id" | "name" | "date" | "slug">[]>(
    path,
    [path],
    true,
    { enabled: true }
  );
}
