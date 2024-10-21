import { useEffect, useState } from "react";

function getVisibility() {
  if (typeof document === "undefined") return true;
  return document.visibilityState;
}

export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(getVisibility());

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(getVisibility() === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
