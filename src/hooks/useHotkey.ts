import { useEffect, useMemo, useRef } from "react";

type HotkeyCombo = {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
};

function parseCombo(combo: string): HotkeyCombo {
  const parts = combo.toLowerCase().split("+");
  return {
    key: parts[parts.length - 1],
    meta: parts.includes("meta") || parts.includes("cmd"),
    ctrl: parts.includes("ctrl"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt"),
  };
}

function matchesCombo(e: KeyboardEvent, combo: HotkeyCombo): boolean {
  return (
    e.key.toLowerCase() === combo.key &&
    !!e.metaKey === !!combo.meta &&
    !!e.ctrlKey === !!combo.ctrl &&
    !!e.shiftKey === !!combo.shift &&
    !!e.altKey === !!combo.alt
  );
}

export function useHotkey(combo: string, callback: () => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const combos = useMemo(
    () => combo.split(",").map((c) => parseCombo(c.trim())),
    [combo]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (combos.some((c) => matchesCombo(e, c))) {
        e.preventDefault();
        callbackRef.current();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [combos]);
}
