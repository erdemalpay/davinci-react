import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { get, post } from ".";
import { Paths } from "./factory";

export interface TrendyolProduct {
  barcode: string;
  productMainId: string;
  stockCode: string;
  quantity: number;
  salePrice: number;
  listPrice: number;
}

interface TrendyolProductsResponse {
  success: boolean;
  total: number;
  products: TrendyolProduct[];
}

export function useGetTrendyolProducts() {
  const query = useQuery<TrendyolProduct[]>({
    queryKey: [`${Paths.Trendyol}/product`],
    queryFn: async () => {
      const response = await get<TrendyolProductsResponse>({
        path: `${Paths.Trendyol}/product`,
      });
      return response.products || [];
    },
  });
  return query.data || [];
}

export function updateTrendyolStocks() {
  return post<any, any>({
    path: `${Paths.Trendyol}/product/update-price-and-inventory`,
    payload: {},
  });
}

export function useUpdateTrendyolStocksMutation() {
  const queryKey = [`${Paths.Trendyol}/product`];
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTrendyolStocks,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
    },
    onSuccess: () => {
      setTimeout(
        () => toast.success("Trendyol stocks updated successfully"),
        200
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export function processAcceptedClaims() {
  return post<any, any>({
    path: `${Paths.Trendyol}/process-accepted-claims`,
    payload: {},
  });
}

export function useProcessAcceptedClaimsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: processAcceptedClaims,
    onSuccess: (data) => {
      const stats = data?.stats;
      const message = stats
        ? `İade işleme tamamlandı: ${stats.cancelled} sipariş iptal edildi, ${stats.skipped} atlandı`
        : "İade işleme başarıyla tamamlandı";

      setTimeout(() => toast.success(message), 200);

      // Orders ve collections'ı yenile
      queryClient.invalidateQueries({ queryKey: [`${Paths.Order}/query`] });
      queryClient.invalidateQueries({ queryKey: [`${Paths.Order}/collection/query`] });
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "İade işleme sırasında hata oluştu";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}
