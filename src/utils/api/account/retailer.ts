import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AccountRetailer, OrderCollection } from "../../../types";
import { axiosClient } from "../axiosClient";
import { Paths, useGet, useGetList, useMutationApi } from "../factory";
import { post, remove } from "../index";

const baseUrl = `${Paths.Order}/retailer`;

export type RetailerCollectionsQuery = {
  after?: string;
  before?: string;
};

export type RetailerCollectionMutationPayload = {
  retailerId: number | string;
  collectionId: number | string;
};

export type RetailerOrderMutationPayload = {
  retailerId: number | string;
  orderId: number | string;
};

export type RetailerBulkCollectionMutationPayload = {
  retailerId: number | string;
  collectionIds: Array<number | string>;
};

export type RetailerBulkOrderMutationPayload = {
  retailerId: number | string;
  orderIds: Array<number | string>;
};

export type RetailerCollectionsResponse = {
  retailer: {
    _id: number | string;
    name: string;
  };
  collections: OrderCollection[];
};

export type RetailerCollectionItemSummaryItem = {
  itemId: number | string;
  itemName: string;
  quantity: number;
  count: number;
};

export type RetailerCollectionItemSummaryResponse = {
  retailer: {
    _id: number | string;
    name: string;
  };
  items: RetailerCollectionItemSummaryItem[];
};

export type RetailerBulkAddCollectionsResponse = {
  retailer: {
    _id: number | string;
    name: string;
  };
  added: number;
  skipped: number;
};

export type RetailerBulkRemoveCollectionsResponse = {
  retailer: {
    _id: number | string;
    name: string;
  };
  removed: number;
};

export type RetailerBulkAddOrdersResponse = RetailerBulkAddCollectionsResponse;

export type RetailerBulkRemoveOrdersResponse =
  RetailerBulkRemoveCollectionsResponse;

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

export function useGetRetailerCollections(
  retailerId?: string,
  query: RetailerCollectionsQuery = {}
) {
  const params = new URLSearchParams();

  if (query.after) params.set("after", query.after);
  if (query.before) params.set("before", query.before);

  const queryString = params.toString();
  const path = retailerId
    ? `${baseUrl}/${retailerId}/collections${
        queryString ? `?${queryString}` : ""
      }`
    : "";

  return useGet<RetailerCollectionsResponse>(
    path,
    [
      baseUrl,
      "collections",
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

export function useGetRetailerCollectionItemSummary(
  retailerId?: string,
  query: RetailerCollectionsQuery = {}
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

  return useGet<RetailerCollectionItemSummaryResponse>(
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

export function addCollectionToRetailer({
  retailerId,
  collectionId,
}: RetailerCollectionMutationPayload): Promise<AccountRetailer> {
  return post<{ collectionId: number | string }, AccountRetailer>({
    path: `${baseUrl}/${retailerId}/collections`,
    payload: { collectionId },
  });
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

export function removeCollectionFromRetailer({
  retailerId,
  collectionId,
}: RetailerCollectionMutationPayload): Promise<AccountRetailer> {
  return remove<AccountRetailer>({
    path: `${baseUrl}/${retailerId}/collections/${collectionId}`,
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

export function bulkAddCollectionsToRetailer({
  retailerId,
  collectionIds,
}: RetailerBulkCollectionMutationPayload): Promise<RetailerBulkAddCollectionsResponse> {
  return post<
    { collectionIds: Array<number | string> },
    RetailerBulkAddCollectionsResponse
  >({
    path: `${baseUrl}/${retailerId}/collections/bulk-add`,
    payload: { collectionIds },
  });
}

export function bulkAddOrdersToRetailer({
  retailerId,
  orderIds,
}: RetailerBulkOrderMutationPayload): Promise<RetailerBulkAddOrdersResponse> {
  return post<
    { orderIds: Array<number | string> },
    RetailerBulkAddOrdersResponse
  >({
    path: `${baseUrl}/${retailerId}/orders/bulk-add`,
    payload: { orderIds },
  });
}

export async function bulkRemoveCollectionsFromRetailer({
  retailerId,
  collectionIds,
}: RetailerBulkCollectionMutationPayload): Promise<RetailerBulkRemoveCollectionsResponse> {
  const { data } =
    await axiosClient.delete<RetailerBulkRemoveCollectionsResponse>(
      `${baseUrl}/${retailerId}/collections/bulk-remove`,
      {
        data: { collectionIds },
      }
    );
  return data;
}

export async function bulkRemoveOrdersFromRetailer({
  retailerId,
  orderIds,
}: RetailerBulkOrderMutationPayload): Promise<RetailerBulkRemoveOrdersResponse> {
  const { data } = await axiosClient.delete<RetailerBulkRemoveOrdersResponse>(
    `${baseUrl}/${retailerId}/orders/bulk-remove`,
    {
      data: { orderIds },
    }
  );
  return data;
}

export function useRetailerCollectionMutations() {
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
    queryClient.invalidateQueries({ queryKey: [baseUrl, "collections"] });
    queryClient.invalidateQueries({ queryKey: [baseUrl, "item-summary"] });

    // Collection documents are directly updated now (collection.retailer),
    // so invalidate collection caches too.
    queryClient.invalidateQueries({ queryKey: [Paths.Order] });
  };

  const {
    mutate: addRetailerCollection,
    isPending: isAddRetailerCollectionPending,
  } = useMutation({
    mutationFn: addCollectionToRetailer,
    onSuccess: invalidateRetailerQueries,
    onError: (err: unknown) => {
      const errorMessage = getErrorMessage(err);
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });

  const {
    mutate: removeRetailerCollection,
    isPending: isRemoveRetailerCollectionPending,
  } = useMutation({
    mutationFn: removeCollectionFromRetailer,
    onSuccess: invalidateRetailerQueries,
    onError: (err: unknown) => {
      const errorMessage = getErrorMessage(err);
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });

  const {
    mutate: bulkAddRetailerCollections,
    isPending: isBulkAddRetailerCollectionsPending,
  } = useMutation({
    mutationFn: bulkAddCollectionsToRetailer,
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
    mutate: bulkRemoveRetailerCollections,
    isPending: isBulkRemoveRetailerCollectionsPending,
  } = useMutation({
    mutationFn: bulkRemoveCollectionsFromRetailer,
    onSuccess: (data) => {
      invalidateRetailerQueries();
      toast.success(`Removed ${data.removed} collection(s)`);
    },
    onError: (err: unknown) => {
      const errorMessage = getErrorMessage(err);
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });

  return {
    addRetailerCollection,
    removeRetailerCollection,
    bulkAddRetailerCollections,
    bulkRemoveRetailerCollections,
    isAddRetailerCollectionPending,
    isRemoveRetailerCollectionPending,
    isBulkAddRetailerCollectionsPending,
    isBulkRemoveRetailerCollectionsPending,
  };
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
    queryClient.invalidateQueries({ queryKey: [baseUrl, "collections"] });
    queryClient.invalidateQueries({ queryKey: [baseUrl, "item-summary"] });
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
