import { describe, expect, it, vi } from "vitest";
import { Order, OrderCollection } from "../types";
import {
  mergeCreatedOrders,
  resyncAfterMissedEvents,
  settleCreatedCollection,
  upsertCollection,
} from "./socketSync";

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

// A placeholder the panel adds while saving has no id and only the table id.
const placeholder = (table: number, amount: number) =>
  ({ table, amount } as OrderCollection);
const saved = (id: number, table: number, amount: number) =>
  ({ _id: id, table: { _id: table }, amount } as OrderCollection);

describe("collection placeholders", () => {
  it("socket event first, then the response: listed once", () => {
    const afterSocket = upsertCollection(
      [saved(1, 7, 100), placeholder(7, 3440)],
      saved(2, 7, 3440)
    );
    const afterResponse = settleCreatedCollection(afterSocket, {
      _id: 2,
      table: 7,
      amount: 3440,
    } as OrderCollection);

    expect(afterResponse.map((c) => c._id)).toEqual([1, 2]);
    // The populated one from the socket is kept.
    expect(afterResponse[1].table).toEqual({ _id: 7 });
  });

  it("response first, then the socket event: listed once", () => {
    const afterResponse = settleCreatedCollection([placeholder(7, 3440)], {
      _id: 2,
      table: 7,
      amount: 3440,
    } as OrderCollection);
    const afterSocket = upsertCollection(afterResponse, saved(2, 7, 3440));

    expect(afterSocket).toEqual([saved(2, 7, 3440)]);
  });

  it("replaces only the placeholder of that payment", () => {
    const collections = [placeholder(7, 1000), placeholder(7, 2440)];

    const result = upsertCollection(collections, saved(2, 7, 2440));

    expect(result).toEqual([placeholder(7, 1000), saved(2, 7, 2440)]);
  });

  it("leaves other tables' placeholders alone", () => {
    const result = upsertCollection([placeholder(8, 3440)], saved(2, 7, 3440));

    expect(result).toEqual([placeholder(8, 3440), saved(2, 7, 3440)]);
  });

  it("updates a known collection in place", () => {
    const cancelled = { ...saved(2, 7, 3440), status: "cancelled" };

    const result = upsertCollection(
      [saved(2, 7, 3440)],
      cancelled as OrderCollection
    );

    expect(result).toEqual([cancelled]);
  });
});
