import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useButtonCallMutations, useGetQueryButtonCalls } from "./buttonCall";

const mocks = vi.hoisted(() => ({ get: vi.fn(), remove: vi.fn() }));

vi.mock("./index", () => ({
  get: mocks.get,
  post: vi.fn(),
  patch: vi.fn(),
  remove: mocks.remove,
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("../../context/Date.context", () => ({ useDateContext: vi.fn() }));
vi.mock("../../context/Location.context", () => ({
  useLocationContext: vi.fn(),
}));

const filters = {
  location: "",
  cancelledBy: [],
  tableName: "",
  date: "",
  before: "",
  after: "",
  type: [],
  sort: "",
  asc: 1,
  search: "",
};

describe("Button Calls page list", () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.get.mockResolvedValue({ data: [] });
    mocks.remove.mockReset();
    mocks.remove.mockResolvedValue({});
    // Oturum açık değilse sorgular çalışmaz
    localStorage.setItem("jwt", "test-token");
  });

  // Sayfadaki "Delete" eylemi: backend silmede olay yayınlamıyor, liste
  // işlemin kendisiyle yenilenmeli.
  it("is refetched after a button call is deleted", async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () => ({
        list: useGetQueryButtonCalls(1, 20, filters),
        mutations: useButtonCallMutations(),
      }),
      { wrapper }
    );
    await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.mutations.deleteButtonCall(7);
    });

    await waitFor(() => expect(mocks.remove).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(2));
  });

  // buttonCallChanged olayı ["/button-calls"] anahtarını yeniler; tarih ve
  // filtreli liste de bu yenilemeyle tazelenmeli.
  it("is refetched when the buttonCallChanged event invalidates the key", async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    renderHook(() => useGetQueryButtonCalls(1, 20, filters), { wrapper });
    await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(1));

    await queryClient.invalidateQueries({
      queryKey: ["/button-calls"],
      exact: false,
    });

    await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(2));
  });
});
