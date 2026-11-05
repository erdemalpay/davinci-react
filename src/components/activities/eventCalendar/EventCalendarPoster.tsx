import { useMemo } from "react";
import { useEventCalendarPoster } from "./useEventCalendarPoster";
import { EventCalendarForm } from "../../../utils/api/eventCalendar";

// Kayıtlı takvimi panelde indirilen afişle aynı çizimle gösterir
const EventCalendarPoster = ({ calendar }: { calendar: EventCalendarForm }) => {
  const data = useMemo(
    () => ({
      title: calendar.title,
      items: calendar.items,
      hasQr: calendar.hasQr !== false,
    }),
    [calendar]
  );
  const { image } = useEventCalendarPoster(data, 0);

  return (
    <div className="aspect-[4/5] w-full rounded-xl overflow-hidden bg-gray-100">
      {image && (
        <img src={image} alt={calendar.title} className="w-full h-full" />
      )}
    </div>
  );
};

export default EventCalendarPoster;
