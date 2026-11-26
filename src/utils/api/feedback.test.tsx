import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGetQueryFeedbacks } from "./feedback";

const mocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("./index", () => ({
  get: mocks.get,
  post: vi.fn(),
  patch: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("useGetQueryFeedbacks", () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.get.mockResolvedValue([]);
    // Oturum açık değilse sorgular çalışmaz
    localStorage.setItem("jwt", "test-token");
  });

  // Sunucudaki feedbackChanged olayı panelde ["/tables/feedback"] anahtarını
  // yeniler; tarih filtreli liste de bu yenilemeyle tazelenmeli.
  it("is refetched when the feedbackChanged event invalidates the feedback key", async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    renderHook(
      () => useGetQueryFeedbacks({ after: "2026-01-01", before: "2026-12-31" }),
      { wrapper }
    );
    await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(1));

    await queryClient.invalidateQueries({
      queryKey: ["/tables/feedback"],
      exact: false,
    });

    await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(2));
  });
});
