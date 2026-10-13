import { describe, expect, it, vi } from "vitest";
import { Order } from "../types";
import { mergeCreatedOrders, resyncAfterMissedEvents } from "./socketSync";

const order = (id: number) => ({ _id: id, table: { _id: 3 } } as Order);

describe("mergeCreatedOrders", () => {
  it("adds the created orders to the day's orders", () => {
    const today = [order(1)];

    const { orders, added } = mergeCreatedOrders(today, [order(2), order(3)]);

    expect(orders?.map((o) => o._id)).toEqual([1, 2, 3]);
    expect(added.map((o) => o._id)).toEqual([2, 3]);
  });

  it("skips orders the panel already has", () => {
    const today = [order(1), order(2)];

    const { orders, added } = mergeCreatedOrders(today, [order(2)]);

    expect(orders).toBe(today);
    expect(added).toEqual([]);
  });

  it("leaves an unloaded list alone", () => {
    expect(mergeCreatedOrders(undefined, [order(1)])).toEqual({
      orders: undefined,
      added: [],
    });
  });
});

describe("resyncAfterMissedEvents", () => {
  it("reloads what is on screen", () => {
    const queryClient = { invalidateQueries: vi.fn() };

    resyncAfterMissedEvents(queryClient as never);

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith();
  });
});
