import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Order } from "../types";
import { useQuantityUpdateQueue } from "./useQuantityUpdateQueue";

type UpdateOrder = Parameters<typeof useQuantityUpdateQueue>[1];

const updateOrder = vi.fn();
const renderQueue = () =>
  renderHook(() =>
    useQuantityUpdateQueue([order], updateOrder as unknown as UpdateOrder)
  );

const order = { _id: 1, quantity: 10, paidQuantity: 0 } as Order;

const lastCallOptions = () =>
  updateOrder.mock.calls[updateOrder.mock.calls.length - 1][1];

describe("useQuantityUpdateQueue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    updateOrder.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the new quantity right away and sends one request after the pause", () => {
    const { result } = renderQueue();

    for (let i = 0; i < 3; i++) {
      act(() => {
        const base = result.current.getQuantityBase(order);
        result.current.queueQuantityUpdate(1, {
          quantity: base.quantity - 1,
          paidQuantity: base.paidQuantity,
        });
      });
    }

    expect(result.current.getQuantityBase(order).quantity).toBe(7);
    expect(updateOrder).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(updateOrder).toHaveBeenCalledTimes(1);
    expect(updateOrder.mock.calls[0][0]).toEqual({
      id: 1,
      updates: { quantity: 7, paidQuantity: 0 },
    });
  });

  it("waits for the running request, then sends the latest quantity", () => {
    const { result } = renderQueue();

    act(() => {
      result.current.queueQuantityUpdate(1, { quantity: 9 });
      vi.advanceTimersByTime(300);
    });
    const firstOptions = lastCallOptions();

    act(() => {
      result.current.queueQuantityUpdate(1, { quantity: 8 });
      vi.advanceTimersByTime(300);
    });
    expect(updateOrder).toHaveBeenCalledTimes(1);

    act(() => {
      firstOptions.onSettled();
    });

    expect(updateOrder).toHaveBeenCalledTimes(2);
    expect(updateOrder.mock.calls[1][0]).toEqual({
      id: 1,
      updates: { quantity: 8 },
    });
  });

  it("goes back to the server quantity when the request fails", () => {
    const { result } = renderQueue();

    act(() => {
      result.current.queueQuantityUpdate(1, { quantity: 9 });
      vi.advanceTimersByTime(300);
    });
    expect(result.current.getQuantityBase(order).quantity).toBe(9);

    act(() => {
      lastCallOptions().onError();
    });

    expect(result.current.getQuantityBase(order).quantity).toBe(10);
  });

  it("sends a waiting change when the panel closes", () => {
    const { result, unmount } = renderQueue();

    act(() => {
      result.current.queueQuantityUpdate(1, { quantity: 9 });
    });
    unmount();

    expect(updateOrder).toHaveBeenCalledTimes(1);
    expect(updateOrder.mock.calls[0][0]).toEqual({
      id: 1,
      updates: { quantity: 9 },
    });
  });
});
