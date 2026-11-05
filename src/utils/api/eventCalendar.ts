import { EventCalendarSetting } from "../../types/index";
import { Paths, useGet, useMutationApi } from "./factory";

const latestPath = `${Paths.EventCalendar}/latest`;

export type EventCalendarForm = Omit<EventCalendarSetting, "_id">;

export function useEventCalendarMutations() {
  const { createItem: createEventCalendar, updateItem: updateEventCalendar } =
    useMutationApi<EventCalendarSetting>({ baseQuery: Paths.EventCalendar });
  return { createEventCalendar, updateEventCalendar };
}

// Panel: yüklenirken undefined; en yeni kayıt ilk sıradadır
export function useGetEventCalendars() {
  return useGet<EventCalendarSetting[]>(Paths.EventCalendar);
}

// Kasadaki QR'ın açtığı herkese açık sayfa (giriş yok, bu yüzden enabled: true);
// yüklenirken undefined, takvim yoksa gövde boş gelir
export function useGetPublicEventCalendar() {
  return useGet<EventCalendarForm | "">(latestPath, [latestPath], true, {
    enabled: true,
  });
}
