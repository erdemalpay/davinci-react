import { useMemo, useRef } from "react";

const sameItems = <T>(a: T[], b: T[]) =>
  a.length === b.length && a.every((item, i) => item === b[i]);

// Groups items by key (e.g. orders by table). A group whose items didn't
// change keeps the same array, so a memoized card only re-renders when its
// own orders change, not on every order of the cafe.
export function groupStable<T>(
  items: T[] | undefined,
  keyOf: (item: T) => number | string | undefined,
  previous: Map<number | string, T[]>
): Map<number | string, T[]> {
  const groups = new Map<number | string, T[]>();
  for (const item of items ?? []) {
    const key = keyOf(item);
    if (key === undefined || key === null) continue;
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  groups.forEach((group, key) => {
    const old = previous.get(key);
    if (old && sameItems(old, group)) groups.set(key, old);
  });
  return groups;
}

export function useStableGroups<T>(
  items: T[] | undefined,
  keyOf: (item: T) => number | string | undefined
) {
  const previous = useRef(new Map<number | string, T[]>());
  return useMemo(() => {
    const groups = groupStable(items, keyOf, previous.current);
    previous.current = groups;
    return groups;
    // keyOf is expected to be a stable, module-level function.
  }, [items]);
}
