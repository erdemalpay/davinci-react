import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWebSocket } from "./useWebSocket";

// A stand-in socket.io client: the socket and its manager (socket.io).
const mocks = vi.hoisted(() => ({
  socket: null as any,
  queryClient: {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    refetchQueries: vi.fn(async () => undefined),
  },
}));

vi.mock("socket.io-client", async () => {
  const { EventEmitter } = await import("events");
  return {
    io: () => {
      const socket: any = new EventEmitter();
      socket.io = new EventEmitter();
      socket.io.engine = { close: vi.fn() };
      socket.connected = true;
      socket.recovered = false;
      socket.connect = vi.fn();
      socket.disconnect = vi.fn();
      mocks.socket = socket;
      return socket;
    },
  };
});
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mocks.queryClient,
}));
vi.mock("../context/Data.context", () => ({
  useDataContext: () => ({ kitchens: [], menuItems: [], visits: [] }),
}));
vi.mock("./../context/Date.context", () => ({
  useDateContext: () => ({ selectedDate: "2026-10-13" }),
}));
vi.mock("./../context/Location.context", () => ({
  useLocationContext: () => ({ selectedLocationId: 1 }),
}));
vi.mock("./../context/Order.context", () => ({
  useOrderContext: () => ({
    setIsTakeAwayPaymentModalOpen: vi.fn(),
    setOrderCreateBulk: vi.fn(),
    setTakeawayTableId: vi.fn(),
    setSelectedNewOrders: vi.fn(),
  }),
}));
vi.mock("./../context/User.context", () => ({
  useUserContext: () => ({ user: { _id: "ali", role: { _id: 1 } } }),
}));
vi.mock("../utils/api/menu/category", () => ({ useGetCategories: () => [] }));
vi.mock("./../utils/printerService", () => ({
  printerService: { isConnected: false, print: vi.fn() },
}));
vi.mock("./../utils/printReceiptESCPOS", () => ({ buildReceiptData: vi.fn() }));
vi.mock("../utils/i18n", () => ({ default: { t: (key: string) => key } }));

class FakeAudioContext {
  state = "running";
  destination = {};
  createGain() {
    return { gain: { value: 1 }, connect: vi.fn() };
  }
  createMediaElementSource() {
    return { connect: vi.fn() };
  }
  resume = vi.fn();
}

const setVisibility = (state: "visible" | "hidden") => {
  Object.defineProperty(document, "visibilityState", {
    value: state,
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("useWebSocket", () => {
  beforeEach(() => {
    vi.stubGlobal("AudioContext", FakeAudioContext);
    vi.useRealTimers();
  });

  const connect = () => {
    renderHook(() => useWebSocket(true));
    act(() => {
      mocks.socket.emit("connect");
    });
    mocks.queryClient.invalidateQueries.mockClear();
  };

  it("reloads the data after a reconnect that couldn't replay missed events", () => {
    connect();

    mocks.socket.recovered = false;
    act(() => {
      mocks.socket.emit("connect");
    });

    expect(mocks.queryClient.invalidateQueries).toHaveBeenCalledWith();
  });

  it("doesn't reload when the server replayed the missed events", () => {
    connect();

    mocks.socket.recovered = true;
    act(() => {
      mocks.socket.emit("connect");
    });

    expect(mocks.queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it("reconnects when the app comes back after a while", () => {
    vi.useFakeTimers();
    connect();

    setVisibility("hidden");
    vi.advanceTimersByTime(60 * 1000);
    setVisibility("visible");

    // A possibly dead connection is replaced right away.
    expect(mocks.socket.io.engine.close).toHaveBeenCalled();
  });

  it("connects when the app comes back disconnected", () => {
    connect();
    mocks.socket.connected = false;

    setVisibility("hidden");
    setVisibility("visible");

    expect(mocks.socket.connect).toHaveBeenCalled();
    mocks.socket.connected = true;
  });

  it("adds orders created at another table without reloading the day's orders", () => {
    connect();
    let today = [{ _id: 1, table: { _id: 3 } }];
    mocks.queryClient.getQueryData.mockImplementation(() => today);
    mocks.queryClient.setQueryData.mockImplementation(
      (_key: unknown, update: (old: unknown) => any) => {
        today = update(today);
      }
    );

    act(() => {
      mocks.socket.emit("createMultipleOrder", {
        table: { _id: 4, name: "7" },
        user: { _id: "ayse" },
        locationId: 1,
        kitchenIds: ["bar"],
        orders: [{ _id: 2, table: { _id: 4 }, status: "pending" }],
      });
    });

    expect(today.map((o) => o._id)).toEqual([1, 2]);
    expect(mocks.queryClient.refetchQueries).not.toHaveBeenCalled();
  });
});
