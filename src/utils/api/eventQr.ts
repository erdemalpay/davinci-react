import { EventQrSetting } from "../../types/index";
import { Paths, useGet, useMutationApi } from "./factory";

const latestPath = `${Paths.EventQr}/latest`;

export type EventQrForm = Omit<EventQrSetting, "_id">;

export function useEventQrMutations() {
  const { createItem: createEventQr, updateItem: updateEventQr } =
    useMutationApi<EventQrSetting>({ baseQuery: Paths.EventQr });
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
