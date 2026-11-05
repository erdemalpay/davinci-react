import { useEffect, useState } from "react";
import { PosterData, renderPoster } from "../../../utils/eventCalendarPoster";

// Afişi çizer; yazarken her tuşta yeniden çizmemek için kısa bir bekleme vardır.
// data'yı useMemo ile ver, yoksa her render'da yeniden çizilir
export function useEventCalendarPoster(
  data: PosterData | undefined,
  delay = 250
) {
  const [image, setImage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!data) return;
    let isCancelled = false;
    setIsLoading(true);
    const timer = setTimeout(() => {
      renderPoster(data)
        .then((url) => !isCancelled && setImage(url))
        .catch(() => !isCancelled && setImage(""))
        .finally(() => !isCancelled && setIsLoading(false));
    }, delay);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [data, delay]);

  return { image, isLoading };
}
