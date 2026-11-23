import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useCancelOrderForDiscountMutation,
  useCreateOrderForDiscountMutation,
} from "./order";

const mocks = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock("../index", () => ({ post: mocks.post, patch: vi.fn() }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("../factory", () => ({
  Paths: { Order: "/order" },
  useGet: vi.fn(),
  useGetList: vi.fn(),
  useMutationApi: vi.fn(),
}));
vi.mock("./../../../context/Date.context", () => ({ useDateContext: vi.fn() }));
vi.mock("./../../../context/Location.context", () => ({
  useLocationContext: vi.fn(),
}));
vi.mock("./../../../context/Order.context", () => ({
  useOrderContext: vi.fn(),
}));

// Masa kartındaki ödeme ekranı bugünün siparişlerini, Masalar sayfasındaki
// masanın kendi listesini okur.
const todayOrdersKey = ["/order/today", "2026-11-15"];
const tableOrdersKey = ["/order/table", 87304];

const setup = () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(todayOrdersKey, []);
  queryClient.setQueryData(tableOrdersKey, []);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const isInvalidated = (queryKey: (string | number)[]) =>
    queryClient.getQueryState(queryKey)?.isInvalidated;
  return { wrapper, isInvalidated };
};

describe("discount mutations", () => {
  beforeEach(() => {
    mocks.post.mockReset();
    mocks.post.mockResolvedValue({});
  });

  // 15 Kasım masa 4: indirim iptali ekrana socket olmadan da yansımalı.
  it("refreshes the payment screen's orders after a discount is cancelled", async () => {
    const { wrapper, isInvalidated } = setup();
    const { result } = renderHook(() => useCancelOrderForDiscountMutation(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ orderId: 240554, cancelQuantity: 1 });
    });

    expect(isInvalidated(todayOrdersKey)).toBe(true);
    expect(isInvalidated(tableOrdersKey)).toBe(true);
  });

  it("refreshes the payment screen's orders after a discount is applied", async () => {
    const { wrapper, isInvalidated } = setup();
    const { result } = renderHook(() => useCreateOrderForDiscountMutation(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        orders: [{ orderId: 240554, totalQuantity: 1, selectedQuantity: 1 }],
        discount: 2,
        discountPercentage: 60,
      });
    });

    expect(isInvalidated(todayOrdersKey)).toBe(true);
    expect(isInvalidated(tableOrdersKey)).toBe(true);
  });
});
