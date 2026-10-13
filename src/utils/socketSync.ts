import { QueryClient } from "@tanstack/react-query";
import { Order } from "../types";

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
