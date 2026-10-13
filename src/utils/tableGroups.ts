import { Table } from "../types";

// The table an order or collection belongs to (populated or as an id).
export const tableIdOf = (item: { table?: Table | number }) =>
  typeof item.table === "number" ? item.table : item.table?._id;

// A shared empty list, so tables without orders keep the same props.
export const NO_ITEMS: never[] = [];
