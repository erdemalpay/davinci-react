import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AccountRetailer, Order } from "../../../types";
import { axiosClient } from "../axiosClient";
import { Paths, useGet, useGetList, useMutationApi } from "../factory";
import { post, remove } from "../index";

const baseUrl = `${Paths.Order}/retailer`;

export type RetailerOrdersQuery = {
  after?: string;
  before?: string;
};

export type RetailerOrderMutationPayload = {
  retailerId: number | string;
  orderId: number | string;
};

export type RetailerBulkOrderMutationPayload = {
  retailerId: number | string;
  orderIds: Array<number | string>;
};

export type RetailerOrdersResponse = {
  retailer: {
    _id: number | string;
    name: string;
  };
  groupedOrders: {
    date: string;
    orders: (Order & { retailer?: number | string })[];
  }[];
};

export type RetailerItemSummaryItem = {
  itemId: number | string;
  itemName: string;
  orderedQuantity: number;
  orderedCount: number;
};

export type RetailerItemSummaryResponse = {
  retailer: {
    _id: number | string;
    name: string;
  };
  items: RetailerItemSummaryItem[];
};

export type RetailerBulkAddResponse = {
  retailer: {
    _id: number | string;
    name: string;
  };
  added: number;
  skipped: number;
};

export type RetailerBulkRemoveResponse = {
  retailer: {
    _id: number | string;
    name: string;
  };
  removed: number;
};

export function useAccountRetailerMutations() {
  const {
    deleteItem: deleteAccountRetailer,
    updateItem: updateAccountRetailer,
    createItem: createAccountRetailer,
  } = useMutationApi<AccountRetailer>({
    baseQuery: baseUrl,
  });

  return {
    deleteAccountRetailer,
    updateAccountRetailer,
    createAccountRetailer,
  };
}

export function useGetAccountRetailers() {
  return useGetList<AccountRetailer>(baseUrl);
}

export function useGetRetailerOrders(
  retailerId?: string,
  query: RetailerOrdersQuery = {}
) {
  const params = new URLSearchParams();

  if (query.after) params.set("after", query.after);
  if (query.before) params.set("before", query.before);

  const queryString = params.toString();
  const path = retailerId
    ? `${baseUrl}/${retailerId}/orders${queryString ? `?${queryString}` : ""}`
    : "";

  return useGet<RetailerOrdersResponse>(
    path,
    [baseUrl, "orders", retailerId, query.after ?? null, query.before ?? null],
    true,
    {
      enabled: Boolean(retailerId),
    }
  );
}

export function useGetRetailerItemSummary(
  retailerId?: string,
  query: RetailerOrdersQuery = {}
) {
  const params = new URLSearchParams();

  if (query.after) params.set("after", query.after);
  if (query.before) params.set("before", query.before);

  const queryString = params.toString();
  const path = retailerId
    ? `${baseUrl}/${retailerId}/item-summary${
        queryString ? `?${queryString}` : ""
      }`
    : "";

  return useGet<RetailerItemSummaryResponse>(
    path,
    [
      baseUrl,
      "item-summary",
      retailerId,
      query.after ?? null,
      query.before ?? null,
    ],
    true,
    {
      enabled: Boolean(retailerId),
    }
  );
}

export function addOrderToRetailer({
  retailerId,
  orderId,
}: RetailerOrderMutationPayload): Promise<AccountRetailer> {
  return post<{ orderId: number | string }, AccountRetailer>({
    path: `${baseUrl}/${retailerId}/orders`,
    payload: { orderId },
  });
}

export function removeOrderFromRetailer({
  retailerId,
  orderId,
}: RetailerOrderMutationPayload): Promise<AccountRetailer> {
  return remove<AccountRetailer>({
    path: `${baseUrl}/${retailerId}/orders/${orderId}`,
  });
}

export function bulkAddOrdersToRetailer({
  retailerId,
  orderIds,
}: RetailerBulkOrderMutationPayload): Promise<RetailerBulkAddResponse> {
  return post<{ orderIds: Array<number | string> }, RetailerBulkAddResponse>({
    path: `${baseUrl}/${retailerId}/orders/bulk-add`,
    payload: { orderIds },
  });
}

export async function bulkRemoveOrdersFromRetailer({
  retailerId,
  orderIds,
}: RetailerBulkOrderMutationPayload): Promise<RetailerBulkRemoveResponse> {
  const { data } = await axiosClient.delete<RetailerBulkRemoveResponse>(
    `${baseUrl}/${retailerId}/orders/bulk-remove`,
    {
      data: { orderIds },
    }
  );
  return data;
}

export function useRetailerOrderMutations() {
  const queryClient = useQueryClient();

  const getErrorMessage = (err: unknown) => {
    if (typeof err === "object" && err !== null) {
      const asObj = err as Record<string, unknown>;
      const response = asObj.response as Record<string, unknown> | undefined;
      const data = response?.data as Record<string, unknown> | undefined;
      const message = data?.message;

      if (typeof message === "string") return message;
      if (Array.isArray(message)) return message.join(", ");
    }
    return "An unexpected error occurred";
  };

  const invalidateRetailerQueries = () => {
    queryClient.invalidateQueries({ queryKey: [baseUrl] });
    queryClient.invalidateQueries({ queryKey: [baseUrl, "orders"] });
    queryClient.invalidateQueries({ queryKey: [baseUrl, "item-summary"] });

    // Order documents are directly updated now (order.retailer),
    // so invalidate order caches too.
    queryClient.invalidateQueries({ queryKey: [Paths.Order] });
  };

  const { mutate: addRetailerOrder, isPending: isAddRetailerOrderPending } =
    useMutation({
      mutationFn: addOrderToRetailer,
      onSuccess: invalidateRetailerQueries,
      onError: (err: unknown) => {
        const errorMessage = getErrorMessage(err);
        setTimeout(() => toast.error(errorMessage), 200);
      },
    });

  const {
    mutate: removeRetailerOrder,
    isPending: isRemoveRetailerOrderPending,
  } = useMutation({
    mutationFn: removeOrderFromRetailer,
    onSuccess: invalidateRetailerQueries,
    onError: (err: unknown) => {
      const errorMessage = getErrorMessage(err);
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });

  const {
    mutate: bulkAddRetailerOrders,
    isPending: isBulkAddRetailerOrdersPending,
  } = useMutation({
    mutationFn: bulkAddOrdersToRetailer,
    onSuccess: (data) => {
      invalidateRetailerQueries();
      if (data.added > 0 || data.skipped > 0) {
        toast.success(`Added ${data.added}, skipped ${data.skipped}`);
      }
    },
    onError: (err: unknown) => {
      const errorMessage = getErrorMessage(err);
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });

  const {
    mutate: bulkRemoveRetailerOrders,
    isPending: isBulkRemoveRetailerOrdersPending,
  } = useMutation({
    mutationFn: bulkRemoveOrdersFromRetailer,
    onSuccess: (data) => {
      invalidateRetailerQueries();
      toast.success(`Removed ${data.removed} order(s)`);
    },
    onError: (err: unknown) => {
      const errorMessage = getErrorMessage(err);
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });

  return {
    addRetailerOrder,
    removeRetailerOrder,
    bulkAddRetailerOrders,
    bulkRemoveRetailerOrders,
    isAddRetailerOrderPending,
    isRemoveRetailerOrderPending,
    isBulkAddRetailerOrdersPending,
    isBulkRemoveRetailerOrdersPending,
  };
}
