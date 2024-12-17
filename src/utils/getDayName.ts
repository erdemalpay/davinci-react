import { toZonedTime } from "date-fns-tz";

export function getDayName(dateString: string) {
  if (!dateString) return "";
  const zonedTime = toZonedTime(new Date(dateString), "UTC");
  const date = new Date(zonedTime);
  return date.toLocaleDateString("tr-TR", { weekday: "long" });
}
