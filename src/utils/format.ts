import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export function formatAsLocalDate(dateString: string) {
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() + offset * 60 * 1000);
  return format(adjustedDate, "dd/MM/yyyy");
}

export function convertDateFormat(dateStr: string) {
  const parts = dateStr.split("-"); // Split the date by '-'
  return `${parts[2]}-${parts[1]}-${parts[0]}`; // Reformat to 'YYYY-MM-DD'
}

export function formatDateInTurkey(dateStr: Date) {
  const timeZone = "Europe/Istanbul";
  const zonedDate = toZonedTime(dateStr, timeZone);
  return format(zonedDate, "yyyy-MM-dd");
}

export function getFirstDayOfCurrentMonth() {
  const now = new Date(); // Gets the current date and time
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  // Formatting the date in 'yyyy-mm-dd' format
  const formattedDate = firstDay.toISOString().slice(0, 10);
  return formattedDate;
}
