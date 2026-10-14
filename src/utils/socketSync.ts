import { QueryClient } from "@tanstack/react-query";
import { Order, OrderCollection } from "../types";
import { tableIdOf as tableOf } from "./tableGroups";

// After a hidden period this long the socket may be silently dead (the
// phone dropped the connection without telling): reconnect right away
// instead of waiting for socket.io's ping timeout (up to 45s).
export const FORCE_RECONNECT_AFTER_HIDDEN_MS = 20 * 1000;

// The connection came back but the server couldn't replay what was missed
// (away longer than its recovery window, or the server restarted): reload
// what is on screen.
export function resyncAfterMissedEvents(queryClient: QueryClient) {
  queryClient.invalidateQueries();
}

const tableIdOf = (order: Order) =>
  typeof order.table === "number" ? order.table : order.table?._id;

// Adds orders that came with a socket event to the day's orders, skipping
// the ones already there (e.g. added by the creating panel itself).
export function mergeCreatedOrders(
  todayOrders: Order[] | undefined,
  created: Order[]
): { orders: Order[] | undefined; added: Order[] } {
  if (!todayOrders) {
    return { orders: todayOrders, added: [] };
  }
  const known = new Set(todayOrders.map((order) => order._id));
  const added = created.filter((order) => !known.has(order._id));
  return {
    orders: added.length ? [...todayOrders, ...added] : todayOrders,
    added,
  };
}

export const ordersOfTable = (orders: Order[], tableId: number) =>
  orders.filter((order) => tableIdOf(order) === tableId);

// A collection this panel added itself while the request was on its way: it
// has no id yet.
const isPendingCollection = (collection: OrderCollection) =>
  collection._id === undefined || collection._id === null;

// Drops the panel's own placeholder for `collection` (same table and
// amount), so the saved collection doesn't show up twice.
function withoutPlaceholderOf(
  collections: OrderCollection[],
  collection: OrderCollection
) {
  const index = collections.findIndex(
    (c) =>
      isPendingCollection(c) &&
      tableOf(c) === tableOf(collection) &&
      c.amount === collection.amount
  );
  return index === -1 ? collections : collections.filter((_, i) => i !== index);
}

// A collection came with a socket event: replaces the one with the same id,
// or the panel's placeholder for it, or adds it.
export function upsertCollection(
  collections: OrderCollection[],
  collection: OrderCollection
): OrderCollection[] {
  if (collections.some((c) => c._id === collection._id)) {
    return collections.map((c) => (c._id === collection._id ? collection : c));
  }
  return [...withoutPlaceholderOf(collections, collection), collection];
}

// The server saved a collection this panel created: its placeholder gives
// way to the saved one, unless the socket event already brought it.
export function settleCreatedCollection(
  collections: OrderCollection[],
  created: OrderCollection
): OrderCollection[] {
  const rest = withoutPlaceholderOf(collections, created);
  return rest.some((c) => c._id === created._id) ? rest : [...rest, created];
}
