import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

type UseStickyColumnsProps = {
  stickyCellCount: number;
  measureToken: string;
};

type StickyCellProps = {
  left: number;
  isLastSticky: boolean;
};

export const useStickyColumns = ({
  stickyCellCount,
  measureToken,
}: UseStickyColumnsProps) => {
  const headerCells = useRef<(HTMLTableCellElement | null)[]>([]);
  const refCallbacks = useRef(
    new Map<number, (element: HTMLTableCellElement | null) => void>()
  );
  const [widths, setWidths] = useState<number[]>([]);

  const registerHeaderCell = useCallback((slot: number) => {
    const cached = refCallbacks.current.get(slot);
    if (cached) return cached;
    const callback = (element: HTMLTableCellElement | null) => {
      headerCells.current[slot] = element;
    };
    refCallbacks.current.set(slot, callback);
    return callback;
  }, []);

  useLayoutEffect(() => {
    if (stickyCellCount === 0) {
      setWidths((prev) => (prev.length === 0 ? prev : []));
      return;
    }
    const cells = headerCells.current.slice(0, stickyCellCount);
    const measure = () =>
      setWidths((prev) => {
        const next = cells.map(
          (cell) => cell?.getBoundingClientRect().width ?? 0
        );
        return next.length === prev.length &&
          next.every((width, index) => width === prev[index])
          ? prev
          : next;
      });
    measure();
    const observer = new ResizeObserver(measure);
    cells.forEach((cell) => {
      if (cell) observer.observe(cell);
    });
    return () => observer.disconnect();
  }, [stickyCellCount, measureToken]);

  const offsets = useMemo(() => {
    const result: number[] = [];
    let total = 0;
    for (let slot = 0; slot < stickyCellCount; slot++) {
      result.push(total);
      total += widths[slot] ?? 0;
    }
    return result;
  }, [stickyCellCount, widths]);

  const getStickyCellProps = useCallback(
    (slot: number): StickyCellProps | undefined =>
      slot < 0 || slot >= stickyCellCount
        ? undefined
        : {
            left: offsets[slot] ?? 0,
            isLastSticky: slot === stickyCellCount - 1,
          },
    [offsets, stickyCellCount]
  );

  return { registerHeaderCell, getStickyCellProps };
};
