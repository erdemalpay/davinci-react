import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IDEFIX_CHANNEL } from "./idefix";
import {
  useCancelMarketplaceOrderMutation,
  useMatchMarketplaceItemsByBarcodeMutation,
  useUpdateMarketplacePriceMutation,
  useUpdateMarketplaceStockMutation,
} from "./marketplace";
import { N11_CHANNEL } from "./n11";

const mocks = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock(".", () => ({ post: mocks.post }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("./factory", () => ({
  Paths: {
    N11: "/n11",
    IDEFIX: "/idefix",
    Order: "/order",
    MenuItems: "/menu/items",
  },
  useGetList: vi.fn(),
}));
vi.mock("../../types", () => ({
  DisabledConditionEnum: {
    ORDERDATAS_N11ORDERS: "n11orders",
    ORDERDATAS_IDEFIXORDERS: "idefixorders",
  },
}));

const setup = () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
};

const sent = () => mocks.post.mock.calls.map(([request]) => request);

describe("marketplace hooks", () => {
  beforeEach(() => {
    mocks.post.mockReset();
    mocks.post.mockResolvedValue({});
  });

  // Ortaklaştırmadan önce n11'in gönderdiği istekler birebir korunmalı.
  it("n11: stok, fiyat ve iptal istekleri eski adres ve alanlarla gider", async () => {
    const { wrapper } = setup();
    const stock = renderHook(
      () => useUpdateMarketplaceStockMutation(N11_CHANNEL),
      { wrapper }
    );
    const price = renderHook(
      () => useUpdateMarketplacePriceMutation(N11_CHANNEL),
      { wrapper }
    );
    const cancel = renderHook(
      () => useCancelMarketplaceOrderMutation(N11_CHANNEL),
      { wrapper }
    );

    await act(async () => {
      await stock.result.current.mutateAsync({ key: "flip7", value: 3 });
      await price.result.current.mutateAsync({ key: "flip7", value: 1500 });
      await cancel.result.current.mutateAsync({
        lineItemId: "415490391",
        quantity: "2" as unknown as number,
      });
    });

    expect(sent()).toEqual([
      {
        path: "/n11/update-stock",
        payload: { stockCode: "flip7", quantity: 3 },
      },
      {
        path: "/n11/update-price",
        payload: { stockCode: "flip7", price: 1500 },
      },
      {
        path: "/order/cancel-n11-order",
        payload: { n11LineItemId: "415490391", quantity: 2 },
      },
    ]);
  });

  it("idefix: aynı istekler barkod ve idefix alanlarıyla gider", async () => {
    const { wrapper } = setup();
    const stock = renderHook(
      () => useUpdateMarketplaceStockMutation(IDEFIX_CHANNEL),
      { wrapper }
    );
    const cancel = renderHook(
      () => useCancelMarketplaceOrderMutation(IDEFIX_CHANNEL),
      { wrapper }
    );

    await act(async () => {
      await stock.result.current.mutateAsync({
        key: "3664824001505",
        value: 4,
      });
      await cancel.result.current.mutateAsync({ lineItemId: "1", quantity: 1 });
    });

    expect(sent()).toEqual([
      {
        path: "/idefix/update-stock",
        payload: { barcode: "3664824001505", quantity: 4 },
      },
      {
        path: "/order/cancel-idefix-order",
        payload: { idefixLineItemId: "1", quantity: 1 },
      },
    ]);
  });

  it("eşleştirme sonucu menü önbelleğinde kanalın alanına yazılır", async () => {
    const { wrapper, queryClient } = setup();
    queryClient.setQueryData(
      ["/menu/items/all"],
      [{ _id: 1 }, { _id: 2 }, { _id: 3 }]
    );
    mocks.post
      .mockResolvedValueOnce({
        results: [{ itemId: 1, status: "matched", stockCode: "flip7" }],
      })
      .mockResolvedValueOnce({
        results: [
          { itemId: 2, status: "matched", idefixBarcode: "0653341025005" },
          { itemId: 3, status: "not_found" },
        ],
      });
    const n11 = renderHook(
      () => useMatchMarketplaceItemsByBarcodeMutation(N11_CHANNEL),
      { wrapper }
    );
    const idefix = renderHook(
      () => useMatchMarketplaceItemsByBarcodeMutation(IDEFIX_CHANNEL),
      { wrapper }
    );

    await act(async () => {
      await n11.result.current.mutateAsync([1]);
      await idefix.result.current.mutateAsync([2, 3]);
    });

    await waitFor(() =>
      expect(queryClient.getQueryData(["/menu/items/all"])).toEqual([
        { _id: 1, n11StockCode: "flip7" },
        { _id: 2, idefixBarcode: "0653341025005" },
        { _id: 3 },
      ])
    );
    expect(sent().map((r) => r.path)).toEqual([
      "/n11/match-items-by-barcode",
      "/idefix/match-items-by-barcode",
    ]);
  });
});
