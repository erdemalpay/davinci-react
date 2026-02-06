import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { get, patch, post, remove, UpdatePayload } from ".";
export const Paths = {
  Authorization: "/authorization",
  Education: "/education",
  Asset: "/asset",
  Activity: "/activity",
  Checkout: "/checkout",
  Games: "/games",
  CafeActivity: "/visits/cafe-activity",
  Gameplays: "/gameplays",
  GameplayTime: "/gameplaytime",
  Users: "/users",
  User: "/users/me",
  Memberships: "/memberships",
  Rewards: "/rewards",
  MenuCategories: "/menu/categories",
  MenuPopular: "/menu/popular",
  MenuItems: "/menu/items",
  MenuUpperCategories: "/menu/upper_categories",
  Menu: "/menu",
  Categories: "/categories",
  Kitchen: "/menu/kitchens",
  Items: "/items",
  AllUsers: "/users?all=true",
  Location: "/location",
  Login: "/login",
  Reservations: "/reservations",
  ReservationsCall: "/reservations/call",
  Tables: "/tables",
  Visits: "/visits",
  Accounting: "/accounting",
  PanelControl: "/panel-control",
  Order: "/order",
  Checklist: "/checklist",
  Ikas: "/ikas",
  Shopify: "/shopify",
  Trendyol: "/trendy",
  Hepsiburada: "/hepsiburada",
  Redis: "/redis",
  ButtonCalls: "/button-calls",
  Notification: "/notification",
  Shift: "/shift",
  ShiftChangeRequest: "/shift-change-request",
  Expiration: "/expiration",
  Point: "/point",
  Consumers: "/consumers",
  Breaks: "/breaks",
};

interface Props<T> {
  baseQuery: string;
  queryKey?: QueryKey;
  isInvalidate?: boolean;
  isAdditionalInvalidate?: boolean;
  sortFunction?: (a: Partial<T>, b: Partial<T>) => number;
  additionalInvalidates?: QueryKey[];
}
export function useGet<T>(
  path: string,
  queryKey?: QueryKey,
  isStaleTimeZero?: boolean,
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">
) {
  const fetchQueryKey = queryKey || [path];

  const { data } = useQuery<T>({
    queryKey: fetchQueryKey,
    queryFn: () => get<T>({ path }),
    staleTime: isStaleTimeZero ? 0 : 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false, // default
    ...options, // spread options after to allow overriding
  });

  return data;
}

export function useGetList<T>(
  path: string,
  queryKey?: QueryKey,
  isStaleTimeZero?: boolean,
  options?: Omit<UseQueryOptions<T[]>, "queryKey" | "queryFn">
) {
  return useGet<T[]>(path, queryKey, isStaleTimeZero, options) || [];
}
export function useMutationApi<T extends { _id: number | string }>({
  baseQuery,
  queryKey = [baseQuery],
  isAdditionalInvalidate = false,
  sortFunction,
  additionalInvalidates,
}: Props<T>) {
  function createRequest(itemDetails: Partial<T>): Promise<T> {
    return post<Partial<T>, T>({
      path: baseQuery,
      payload: itemDetails,
    });
  }

  function deleteRequest(id: number | string): Promise<T> {
    return remove<T>({
      path: `${baseQuery}/${id}`,
    });
  }

  function updateRequest({ id, updates }: UpdatePayload<T>): Promise<T> {
    return patch<Partial<T>, T>({
      path: `${baseQuery}/${id}`,
      payload: updates,
    });
  }
  const { t } = useTranslation();
  function useCreateItemMutation() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: createRequest,
      // We are updating tables query data with new item
      onMutate: async (itemDetails) => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries({ queryKey });
        // Snapshot the previous value
        const previousItems = queryClient.getQueryData<T[]>(queryKey);
        if (!previousItems) return;
        const updatedItems = [...(previousItems as T[]), itemDetails];
        if (sortFunction) {
          updatedItems.sort(sortFunction);
        }
        // Optimistically update to the new value
        queryClient.setQueryData(queryKey, updatedItems);

        // Return a context object with the snapshotted value
        return { previousItems };
      },
      // If the mutation fails, use the context returned from onMutate to roll back
      onError: (_err: any, _newTable, context) => {
        const previousItemContext = context as {
          previousItems: T[];
        };
        if (previousItemContext?.previousItems) {
          const { previousItems } = previousItemContext;
          queryClient.setQueryData<T[]>(queryKey, previousItems);
        }
        const errorMessage =
          _err?.response?.data?.message || "An unexpected error occurred";
        setTimeout(() => toast.error(t(errorMessage)), 200);
      },
      // Always refetch after error or success:
      onSettled: async (newItem, error, _variables, context) => {
        const previousItemContext = context as {
          previousItems: T[];
        };
        const updatedItems = [
          ...(previousItemContext?.previousItems || []),
          newItem,
        ];
        queryClient.setQueryData(queryKey, updatedItems);
        if (isAdditionalInvalidate) {
          additionalInvalidates?.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        }
      },
    });
  }
  function useDeleteItemMutation() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: deleteRequest,
      onMutate: async (id) => {
        await queryClient.cancelQueries({ queryKey });
        const previousItems = queryClient.getQueryData<T[]>(queryKey) || [];
        const updatedItems = previousItems.filter((item) => item._id !== id);
        if (sortFunction) {
          updatedItems.sort(sortFunction);
        }
        queryClient.setQueryData(queryKey, updatedItems);
        return { previousItems };
      },
      // If the mutation fails, use the context returned from onMutate to roll back
      onError: (_err: any, _newTable, context) => {
        const previousItemContext = context as {
          previousItems: T[];
        };
        if (previousItemContext?.previousItems) {
          const { previousItems } = previousItemContext;
          queryClient.setQueryData<T[]>(queryKey, previousItems);
        }
        const errorMessage =
          _err?.response?.data?.message || "An unexpected error occurred";
        setTimeout(() => toast.error(t(errorMessage)), 200);
      },
    });
  }
  function useUpdateItemMutation() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: updateRequest,
      onMutate: async ({ id, updates }: UpdatePayload<T>) => {
        await queryClient.cancelQueries({ queryKey });
        const previousItems = queryClient.getQueryData<T[]>(queryKey) || [];

        const updatedItems = [...previousItems];
        for (let i = 0; i < updatedItems.length; i++) {
          if (updatedItems[i]._id === id) {
            updatedItems[i] = { ...updatedItems[i], ...updates };
          }
        }

        if (sortFunction) {
          updatedItems.sort(sortFunction);
        }
        queryClient.setQueryData(queryKey, updatedItems);
        return { previousItems };
      },
      // If the mutation fails, use the context returned from onMutate to roll back
      onError: (_err: any, _newTable, context) => {
        const previousItemContext = context as {
          previousItems: T[];
        };
        if (previousItemContext?.previousItems) {
          const { previousItems } = previousItemContext;
          queryClient.setQueryData<T[]>(queryKey, previousItems);
        }
        const errorMessage =
          _err?.response?.data?.message || "An unexpected error occurred";
        setTimeout(() => toast.error(t(errorMessage)), 200);
      },
      // Always refetch after error or success:
      onSettled: async (updatedItem, error, _variables, context) => {
        const previousItemContext = context as {
          previousItems: T[];
        };
        const updatedItems = (previousItemContext?.previousItems || []).map(
          (item) => (item._id === updatedItem?._id ? updatedItem : item)
        );
        queryClient.setQueryData(queryKey, updatedItems);
        if (isAdditionalInvalidate) {
          additionalInvalidates?.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        }
      },
    });
  }

  const { mutate: deleteItem } = useDeleteItemMutation();
  const { mutate: updateItem } = useUpdateItemMutation();
  const { mutate: createItem } = useCreateItemMutation();

  return {
    deleteItem,
    updateItem,
    createItem,
  };
}
