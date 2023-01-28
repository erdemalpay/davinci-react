import { isToday, intervalToDuration, parseISO } from "date-fns";
export function getDuration(
  dateString: string,
  startTime: string,
  finishTime?: string
) {
  const start = parseISO(`${dateString} ${startTime}`);
  let end = parseISO(`${dateString} ${finishTime}`);

  if (!finishTime) {
    if (isToday(parseISO(dateString))) {
      end = new Date();
    } else {
      end = parseISO(`${dateString} 23:59`);
    }
  }
  const { hours, minutes } = intervalToDuration({ start, end });

  return `${hours ? hours + "h " : ""}${minutes}m`;
}

export function getTimeString(date: Date) {
  const hours = date.getHours();
  let minutes = `${date.getMinutes()}`;
  minutes = minutes.length === 1 ? `0${minutes}` : minutes;
  return `${hours}:${minutes}`;
}
