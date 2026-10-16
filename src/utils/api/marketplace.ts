import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { post } from ".";
import { DisabledConditionEnum } from "../../types";
import { Paths, useGetList } from "./factory";

// Polling ile çalışan pazaryerlerinin (n11, idefix) kanala özel ayarları.
// Hook'lar ve sayfalar bu ayarla çalışır; yeni kanal yeni bir ayardır.
export type MarketplaceChannel<P = any> = {
  // Çeviri anahtarlarının öneki de budur ("n11 Orders", "idefix Orders").
  label: "n11" | "idefix";
  path: string;
  // Menü ürününde pazaryeri ürününü tutan alan.
  menuItemField: "n11StockCode" | "idefixBarcode";
  // Pazaryeri ürününün anahtarı; stok/fiyat güncellemesinde de bu adla gider.
  productKey: "stockCode" | "barcode";
  productStock: (product: P) => number;
  productPrice: (product: P) => number;
  // Eşleştirme sonucunda pazaryeri anahtarının geldiği alan.
  matchResultKey: "stockCode" | "idefixBarcode";
  orderNumberField: "n11OrderNumber" | "idefixOrderNumber";
  lineItemField: "n11LineItemId" | "idefixLineItemId";
  ordersDisabledCondition: DisabledConditionEnum;
  excelFileName: string;
};

const showError = (t: TFunction) => (_err: unknown) => {
  const errorMessage =
    (_err as any)?.response?.data?.message || t("An unexpected error occurred");
  setTimeout(() => toast.error(errorMessage), 200);
};

const productsKey = (channel: MarketplaceChannel) => [
  `${channel.path}/products`,
];

export function useGetMarketplaceProducts<P>(channel: MarketplaceChannel<P>) {
  return useGetList<P>(`${channel.path}/products`);
}

export function useUpdateAllMarketplaceStocksMutation(
  channel: MarketplaceChannel
) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: () =>
      post({ path: `${channel.path}/update-all-stocks`, payload: {} }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: productsKey(channel) });
      setTimeout(
        () =>
          toast.success(
            data?.updated
              ? t(`${channel.label} stock: {{updated}} products sent`, {
                  updated: data.updated,
                })
              : t(`${channel.label} stocks are already up to date`)
          ),
        200
      );
    },
    onError: showError(t),
  });
}

export function useUpdateAllMarketplacePricesMutation(
  channel: MarketplaceChannel
) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: () =>
      post({ path: `${channel.path}/update-all-prices`, payload: {} }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: productsKey(channel) });
      const missing = data?.noOnlinePrice?.length ?? 0;
      setTimeout(
        () =>
          toast.success(
            missing
              ? t(
                  `${channel.label} price: {{updated}} products sent, {{missing}} without online price`,
                  { updated: data?.updated ?? 0, missing }
                )
              : data?.updated
              ? t(`${channel.label} price: {{updated}} products sent`, {
                  updated: data.updated,
                })
              : t(`${channel.label} prices are already up to date`)
          ),
        200
      );
    },
    onError: showError(t),
  });
}

function useUpdateMarketplaceProductMutation(
  channel: MarketplaceChannel,
  field: "quantity" | "price",
  successMessage: string
) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const endpoint = field === "quantity" ? "update-stock" : "update-price";
  return useMutation({
    mutationFn: (payload: { key: string; value: number }) =>
      post({
        path: `${channel.path}/${endpoint}`,
        payload: { [channel.productKey]: payload.key, [field]: payload.value },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsKey(channel) });
      setTimeout(() => toast.success(t(successMessage)), 200);
    },
    onError: showError(t),
  });
}

export function useUpdateMarketplaceStockMutation(channel: MarketplaceChannel) {
  return useUpdateMarketplaceProductMutation(
    channel,
    "quantity",
    "Stock updated successfully"
  );
}

export function useUpdateMarketplacePriceMutation(channel: MarketplaceChannel) {
  return useUpdateMarketplaceProductMutation(
    channel,
    "price",
    "Price updated successfully"
  );
}

export function useMatchMarketplaceItemsByBarcodeMutation(
  channel: MarketplaceChannel
) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (itemIds: number[]) =>
      post({
        path: `${channel.path}/match-items-by-barcode`,
        payload: { itemIds },
      }),
    onSuccess: (data: any) => {
      const results: Array<Record<string, any>> = data?.results ?? [];
      for (const queryKey of [[`${Paths.MenuItems}/all`], [Paths.MenuItems]]) {
        const previousItems = queryClient.getQueryData<any[]>(queryKey);
        if (previousItems && previousItems.length > 0) {
          queryClient.setQueryData(
            queryKey,
            previousItems.map((item) => {
              const result = results.find(
                (r) =>
                  String(r.itemId) === String(item._id) &&
                  r.status === "matched"
              );
              const productKey = result?.[channel.matchResultKey];
              return productKey
                ? { ...item, [channel.menuItemField]: productKey }
                : item;
            })
          );
        }
      }
      setTimeout(
        () =>
          toast.success(
            t(
              `${channel.label} — Matched: {{matched}}, Already matched to another item: {{alreadyMatched}}, Not found: {{notFound}}, No barcode: {{noBarcode}}`,
              {
                matched: data?.matched ?? 0,
                alreadyMatched: data?.alreadyMatched ?? 0,
                notFound: data?.notFound ?? 0,
                noBarcode: data?.noBarcode ?? 0,
              }
            )
          ),
        200
      );
    },
    onError: showError(t),
  });
}

function invalidateOrders(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [`${Paths.Order}/query`] });
  queryClient.invalidateQueries({
    queryKey: [`${Paths.Order}/collection/query`],
  });
}

export function useSyncMarketplaceOrdersMutation(channel: MarketplaceChannel) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: () =>
      post<any, any>({ path: `${channel.path}/sync-orders`, payload: {} }),
    onSuccess: (data: any) => {
      setTimeout(
        () =>
          toast.success(
            data?.skipped
              ? t(`${channel.label} sync is already running`)
              : t(
                  `${channel.label} sync: {{created}} orders added, {{cancelled}} cancelled`,
                  {
                    created: data?.created ?? 0,
                    cancelled: data?.cancelled ?? 0,
                  }
                )
          ),
        200
      );
      invalidateOrders(queryClient);
    },
    onError: showError(t),
  });
}

export function useProcessMarketplaceClaimsMutation(
  channel: MarketplaceChannel
) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: () =>
      post<any, any>({
        path: `${channel.path}/process-accepted-claims`,
        payload: {},
      }),
    onSuccess: (data: any) => {
      const stats = data?.stats;
      setTimeout(
        () =>
          toast.success(
            stats
              ? t(
                  `${channel.label} claims processed: {{cancelled}} orders cancelled, {{skipped}} skipped`,
                  { cancelled: stats.cancelled, skipped: stats.skipped }
                )
              : t(`${channel.label} claims processed successfully`)
          ),
        200
      );
      invalidateOrders(queryClient);
    },
    onError: showError(t),
  });
}

export function useCancelMarketplaceOrderMutation(channel: MarketplaceChannel) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: { lineItemId: string; quantity: number }) =>
      post({
        path: `${Paths.Order}/cancel-${channel.label}-order`,
        payload: {
          [channel.lineItemField]: payload.lineItemId,
          quantity: Number(payload.quantity),
        },
      }),
    onMutate: async () => {
      invalidateOrders(queryClient);
    },
    onSettled: () => {
      invalidateOrders(queryClient);
    },
    onError: showError(t),
  });
}
