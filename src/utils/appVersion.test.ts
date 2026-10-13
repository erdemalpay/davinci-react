import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchDeployedBuildId, isUserBusy, reloadForBuild } from "./appVersion";

describe("fetchDeployedBuildId", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reads the deployed build id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ buildId: "abc123" }),
      })
    );

    await expect(fetchDeployedBuildId()).resolves.toBe("abc123");
  });

  it("can't tell when the page comes back instead of the file", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new SyntaxError("Unexpected token <");
        },
      })
    );

    await expect(fetchDeployedBuildId()).resolves.toBeNull();
  });

  it("can't tell while offline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(fetchDeployedBuildId()).resolves.toBeNull();
  });
});

describe("reloadForBuild", () => {
  const reload = vi.fn();

  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal("location", { ...window.location, reload });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("reloads once per version", () => {
    expect(reloadForBuild("v2")).toBe(true);
    expect(reloadForBuild("v2")).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("reloads again for a later version", () => {
    reloadForBuild("v2");
    expect(reloadForBuild("v3")).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });
});

describe("isUserBusy", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  const visible = (element: Element) =>
    vi
      .spyOn(element, "getClientRects")
      .mockReturnValue([{}] as unknown as DOMRectList);

  it("is free with nothing open", () => {
    document.body.innerHTML = "<button>Tables</button>";

    expect(isUserBusy()).toBe(false);
  });

  it("is busy while a dialog is open", () => {
    document.body.innerHTML =
      '<div class="z-[99999] fixed w-full h-full inset-0">payment</div>';
    visible(document.body.firstElementChild!);

    expect(isUserBusy()).toBe(true);
  });

  it("is free when the dialog is hidden", () => {
    document.body.innerHTML = '<div class="hidden fixed inset-0"></div>';

    expect(isUserBusy()).toBe(false);
  });

  it("is busy while typing in a field", () => {
    document.body.innerHTML = "<input />";
    document.querySelector("input")!.focus();

    expect(isUserBusy()).toBe(true);
  });
});
