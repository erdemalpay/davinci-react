import { beforeEach, describe, expect, it } from "vitest";
import { getAuthToken, setAuthToken } from "../authToken";
import { axiosClient, isSessionOver } from "./axiosClient";

// Runs the client's response error handler on a fake failed request.
const fail = (status: number, url = "/tables") => {
  const handlers = (
    axiosClient.interceptors.response as unknown as {
      handlers: { rejected: (error: unknown) => Promise<unknown> }[];
    }
  ).handlers;
  const error = {
    config: { url },
    response: { status, data: { statusCode: status } },
  };
  return handlers[0].rejected(error).catch(() => undefined);
};

describe("axiosClient", () => {
  beforeEach(() => {
    localStorage.clear();
    setAuthToken("token-1");
  });

  it("sends the token from localStorage", async () => {
    const handlers = (
      axiosClient.interceptors.request as unknown as {
        handlers: { fulfilled: (req: unknown) => Promise<any> }[];
      }
    ).handlers;
    const { AxiosHeaders } = await import("axios");
    const req = await handlers[0].fulfilled({ headers: new AxiosHeaders() });

    expect(req.headers.get("Authorization")).toBe("Bearer token-1");
  });

  it("ends the session on a 401", async () => {
    await fail(401);
    expect(getAuthToken()).toBeUndefined();
  });

  // The API answers 503 when it can't check the session (busy database).
  it("keeps the session when the API is unavailable or failing", async () => {
    await fail(503);
    await fail(500);
    expect(getAuthToken()).toBe("token-1");
  });

  it("ignores a wrong password on the login page", async () => {
    await fail(401, "/auth/login");
    expect(getAuthToken()).toBe("token-1");
  });

  it("only treats 401 as the end of a session", () => {
    expect(isSessionOver({ response: { status: 401 } })).toBe(true);
    expect(isSessionOver({ response: { status: 503 } })).toBe(false);
    expect(isSessionOver(new Error("Network Error"))).toBe(false);
  });
});
