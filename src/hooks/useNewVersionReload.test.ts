import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHECK_EVERY_MS,
  IDLE_BEFORE_RELOAD_MS,
  useNewVersionReload,
} from "./useNewVersionReload";

const mocks = vi.hoisted(() => ({
  pathname: "/tables",
  fetchDeployedBuildId: vi.fn(),
  isUserBusy: vi.fn(),
  reloadForBuild: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: mocks.pathname }),
}));
vi.mock("../utils/appVersion", () => ({
  BUILD_ID: "old",
  fetchDeployedBuildId: mocks.fetchDeployedBuildId,
  isUserBusy: mocks.isUserBusy,
  reloadForBuild: mocks.reloadForBuild,
}));

// Lets the version check (a resolved promise) finish.
const flush = () => act(async () => undefined);

const setVisibility = async (state: "visible" | "hidden") => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  await act(async () => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
};

describe("useNewVersionReload", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.pathname = "/tables";
    mocks.isUserBusy.mockReturnValue(false);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does nothing while the panel is up to date", async () => {
    mocks.fetchDeployedBuildId.mockResolvedValue("old");

    const { result } = renderHook(() => useNewVersionReload());
    await flush();
    await act(async () => {
      vi.advanceTimersByTime(CHECK_EVERY_MS + IDLE_BEFORE_RELOAD_MS);
    });

    expect(result.current.isNewVersionReady).toBe(false);
    expect(mocks.reloadForBuild).not.toHaveBeenCalled();
  });

  it("reloads after a minute without input once a new version is out", async () => {
    mocks.fetchDeployedBuildId.mockResolvedValue("new");

    const { result } = renderHook(() => useNewVersionReload());
    await flush();
    expect(result.current.isNewVersionReady).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(IDLE_BEFORE_RELOAD_MS + 15_000);
    });

    expect(mocks.reloadForBuild).toHaveBeenCalledWith("new");
  });

  it("waits while someone keeps using the panel", async () => {
    mocks.fetchDeployedBuildId.mockResolvedValue("new");

    renderHook(() => useNewVersionReload());
    await flush();
    for (let i = 0; i < 8; i++) {
      await act(async () => {
        vi.advanceTimersByTime(15_000);
        window.dispatchEvent(new Event("pointerdown"));
      });
    }

    expect(mocks.reloadForBuild).not.toHaveBeenCalled();
  });

  // The bug behind a negative payment: the old code kept running mid-payment.
  it("never reloads while a dialog is open", async () => {
    mocks.fetchDeployedBuildId.mockResolvedValue("new");
    mocks.isUserBusy.mockReturnValue(true);

    renderHook(() => useNewVersionReload());
    await flush();
    await act(async () => {
      vi.advanceTimersByTime(5 * IDLE_BEFORE_RELOAD_MS);
    });
    await setVisibility("visible");

    expect(mocks.reloadForBuild).not.toHaveBeenCalled();
  });

  it("reloads when coming back to the panel", async () => {
    mocks.fetchDeployedBuildId.mockResolvedValue("old");
    renderHook(() => useNewVersionReload());
    await flush();

    mocks.fetchDeployedBuildId.mockResolvedValue("new");
    await setVisibility("hidden");
    await setVisibility("visible");

    expect(mocks.reloadForBuild).toHaveBeenCalledWith("new");
  });

  it("reloads on the next page change, even if a dialog was open", async () => {
    mocks.fetchDeployedBuildId.mockResolvedValue("new");
    mocks.isUserBusy.mockReturnValue(true);

    const { rerender } = renderHook(() => useNewVersionReload());
    await flush();
    expect(mocks.reloadForBuild).not.toHaveBeenCalled();

    mocks.pathname = "/orders";
    rerender();

    expect(mocks.reloadForBuild).toHaveBeenCalledWith("new");
  });

  it("stays quiet when the version can't be told", async () => {
    mocks.fetchDeployedBuildId.mockResolvedValue(null);

    const { result } = renderHook(() => useNewVersionReload());
    await flush();
    await act(async () => {
      vi.advanceTimersByTime(CHECK_EVERY_MS + IDLE_BEFORE_RELOAD_MS);
    });

    expect(result.current.isNewVersionReady).toBe(false);
    expect(mocks.reloadForBuild).not.toHaveBeenCalled();
  });
});
