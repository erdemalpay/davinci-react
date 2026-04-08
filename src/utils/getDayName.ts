import { toIstDate } from "./format";

export function getDayName(dateString: string) {
  if (!dateString) return "";
  const date = toIstDate(dateString);
  return date.toLocaleDateString("tr-TR", { weekday: "long" });
}
