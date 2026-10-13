import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useAuth, { retryDelay } from "./useAuth";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  navigate: vi.fn(),
  setUser: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: "/tables" }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ i18n: { changeLanguage: vi.fn() } }),
}));
vi.mock("../context/User.context", () => ({
  useUserContext: () => ({ user: undefined, setUser: mocks.setUser }),
}));
vi.mock("./../context/General.context", () => ({
  useGeneralContext: () => ({ setRowsPerPage: vi.fn() }),
}));
vi.mock("../utils/api/user", () => ({
  getUserWithToken: mocks.getUser,
}));
vi.mock("../utils/api/factory", () => ({ Paths: { Login: "/login" } }));
vi.mock("./../types/index", () => ({
  languageOptions: [{ code: "tr" }],
  RowPerPageEnum: { FIRST: 10 },
}));

const httpError = (status: number) => ({
  response: { status, data: { statusCode: status } },
});

describe("useAuth", () => {
  beforeEach(() => {
    localStorage.setItem("jwt", "token-1");
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  // A busy API at peak hours used to send people to the login page.
  it("keeps trying while the API is unavailable, without logging out", async () => {
    mocks.getUser
      .mockRejectedValueOnce(httpError(503))
      .mockResolvedValueOnce({ _id: "ali" });

    renderHook(() => useAuth());

    await waitFor(() => expect(mocks.setUser).toHaveBeenCalled(), {
      timeout: 3000,
    });
    expect(mocks.setUser).toHaveBeenCalledWith({ _id: "ali" });
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("goes to the login page when the session is over", async () => {
    mocks.getUser.mockRejectedValueOnce(httpError(401));

    renderHook(() => useAuth());

    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith(
        "/login",
        expect.objectContaining({ replace: true })
      )
    );
  });

  it("goes to the login page without a token", async () => {
    localStorage.removeItem("jwt");

    renderHook(() => useAuth());

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalled());
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it("waits longer between tries, up to 15 seconds", () => {
    expect([0, 1, 2, 3, 10].map(retryDelay)).toEqual([
      1000, 2000, 4000, 8000, 15000,
    ]);
  });
});
