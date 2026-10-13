import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { post } from ".";
import { Paths, useGetList } from "./factory";

export interface N11Product {
  n11ProductId: number;
  stockCode: string;
  barcode: string | null;
  title: string;
  status: string;
  saleStatus: string;
  quantity: number;
  salePrice: number;
  listPrice: number;
}

const productsKey = [`${Paths.N11}/products`];

const showError = (t: TFunction) => (_err: unknown) => {
  const errorMessage =
    (_err as any)?.response?.data?.message || t("An unexpected error occurred");
  setTimeout(() => toast.error(errorMessage), 200);
};

export function useGetN11Products() {
  return useGetList<N11Product>(`${Paths.N11}/products`);
}

export function useUpdateAllN11StocksMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: () =>
      post({ path: `${Paths.N11}/update-all-stocks`, payload: {} }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: productsKey });
      setTimeout(
        () =>
          toast.success(
            t("n11 stock: {{updated}} products sent", {
              updated: data?.updated ?? 0,
            })
          ),
        200
      );
    },
    onError: showError(t),
  });
}

export function useUpdateAllN11PricesMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: () =>
      post({ path: `${Paths.N11}/update-all-prices`, payload: {} }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: productsKey });
      const missing = data?.noOnlinePrice?.length ?? 0;
      setTimeout(
        () =>
          toast.success(
            missing
              ? t(
                  "n11 price: {{updated}} products sent, {{missing}} without online price",
                  { updated: data?.updated ?? 0, missing }
                )
              : t("n11 price: {{updated}} products sent", {
                  updated: data?.updated ?? 0,
                })
          ),
        200
      );
    },
    onError: showError(t),
  });
}

export function useUpdateN11StockMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: { stockCode: string; quantity: number }) =>
      post({ path: `${Paths.N11}/update-stock`, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsKey });
      setTimeout(() => toast.success(t("Stock updated successfully")), 200);
    },
    onError: showError(t),
  });
}

export function useUpdateN11PriceMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: { stockCode: string; price: number }) =>
      post({ path: `${Paths.N11}/update-price`, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsKey });
      setTimeout(() => toast.success(t("Price updated successfully")), 200);
    },
    onError: showError(t),
  });
}

export function matchN11ItemsByBarcode(itemIds: number[]) {
  return post({
    path: `${Paths.N11}/match-items-by-barcode`,
    payload: { itemIds },
  });
}

export function useMatchN11ItemsByBarcodeMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: matchN11ItemsByBarcode,
    onSuccess: (data: any) => {
      const results: Array<{
        itemId: any;
        stockCode?: string;
        status: string;
      }> = data?.results ?? [];
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
              return result?.stockCode
                ? { ...item, n11StockCode: result.stockCode }
                : item;
            })
          );
        }
      }
      setTimeout(
        () =>
          toast.success(
            t(
              "n11 — Matched: {{matched}}, Already matched to another item: {{alreadyMatched}}, Not found: {{notFound}}, No barcode: {{noBarcode}}",
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

export function useSyncN11OrdersMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: () =>
      post<any, any>({ path: `${Paths.N11}/sync-orders`, payload: {} }),
    onSuccess: (data: any) => {
      setTimeout(
        () =>
          toast.success(
            data?.skipped
              ? t("n11 sync is already running")
              : t(
                  "n11 sync: {{created}} orders added, {{cancelled}} cancelled",
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

export function useProcessN11AcceptedClaimsMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: () =>
      post<any, any>({
        path: `${Paths.N11}/process-accepted-claims`,
        payload: {},
      }),
    onSuccess: (data: any) => {
      const stats = data?.stats;
      setTimeout(
        () =>
          toast.success(
            stats
              ? t(
                  "n11 claims processed: {{cancelled}} orders cancelled, {{skipped}} skipped",
                  { cancelled: stats.cancelled, skipped: stats.skipped }
                )
              : t("n11 claims processed successfully")
          ),
        200
      );
      invalidateOrders(queryClient);
    },
    onError: showError(t),
  });
}
