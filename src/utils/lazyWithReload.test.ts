import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reloadForNewVersion } from "./lazyWithReload";

describe("reloadForNewVersion", () => {
  const reload = vi.fn();

  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal("location", { ...window.location, reload });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("reloads once when a code file of an old version is gone", () => {
    const error = new Error("Failed to fetch dynamically imported module");

    expect(() => reloadForNewVersion(error)).toThrow(error);
    expect(() => reloadForNewVersion(error)).toThrow(error);

    // No reload loop if the new version fails too.
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
