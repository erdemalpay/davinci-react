import Cookies from "js-cookie";
import { beforeEach, describe, expect, it } from "vitest";
import { clearAuthToken, getAuthToken, setAuthToken } from "./authToken";

describe("auth token", () => {
  beforeEach(() => {
    localStorage.clear();
    Cookies.remove("jwt");
  });

  it("survives the browser dropping its session cookie", () => {
    setAuthToken("token-1");
    // What an old phone does when it closes the browser in the background.
    Cookies.remove("jwt");

    expect(getAuthToken()).toBe("token-1");
  });

  it("still works for sessions that only have the cookie", () => {
    Cookies.set("jwt", "old-token");

    expect(getAuthToken()).toBe("old-token");
  });

  it("is gone everywhere after logging out", () => {
    setAuthToken("token-1");
    clearAuthToken();

    expect(getAuthToken()).toBeUndefined();
  });
});
