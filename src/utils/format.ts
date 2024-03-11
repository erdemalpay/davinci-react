import { format } from "date-fns";

export function formatAsLocalDate(dateString: string) {
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() + offset * 60 * 1000);
  return format(adjustedDate, "dd-MM-yyyy");
}
