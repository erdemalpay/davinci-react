import { useEffect } from "react";

// Stops the page behind a full screen panel from scrolling while it is open.
export function useLockBodyScroll(isLocked = true) {
  useEffect(() => {
    if (!isLocked) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isLocked]);
}
