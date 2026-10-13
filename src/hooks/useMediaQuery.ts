import { useEffect, useState } from "react";

// Follows a CSS media query; re-renders only when it starts or stops
// matching (not on every resize event).
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia(query).matches
      : false
  );

  useEffect(() => {
    if (!window.matchMedia) return;
    const mediaQuery = window.matchMedia(query);
    const onChange = () => setMatches(mediaQuery.matches);
    onChange();
    mediaQuery.addEventListener?.("change", onChange);
    return () => mediaQuery.removeEventListener?.("change", onChange);
  }, [query]);

  return matches;
}

// Tailwind's lg breakpoint.
export const useIsLgScreen = () => useMediaQuery("(min-width: 1024px)");
