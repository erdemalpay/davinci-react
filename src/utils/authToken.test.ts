import Cookies from "js-cookie";
import { beforeEach, describe, expect, it } from "vitest";
import { shouldEnableQuery } from "./auth";
import { clearAuthToken, getAuthToken, setAuthToken } from "./authToken";

describe("auth token", () => {
  beforeEach(() => {
    localStorage.clear();
    Cookies.remove("jwt");
  });

  it("reads the token from localStorage", () => {
    setAuthToken("token-1");

    expect(getAuthToken()).toBe("token-1");
  });

  it("is gone everywhere after logging out", () => {
    setAuthToken("token-1");
    Cookies.set("jwt", "old-token");
    clearAuthToken();

    expect(getAuthToken()).toBeUndefined();
    expect(Cookies.get("jwt")).toBeUndefined();
  });

  it("counts as logged out once localStorage is cleared", () => {
    setAuthToken("token-1");
    Cookies.set("jwt", "old-token");
    localStorage.clear();

    expect(getAuthToken()).toBeUndefined();
    expect(shouldEnableQuery()).toBe(false);
  });
});
