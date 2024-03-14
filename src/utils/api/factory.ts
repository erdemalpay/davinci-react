import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "react-toastify";
import { UpdatePayload, get, patch, post, remove } from ".";

export const Paths = {
  Games: "/games",
  Gameplays: "/gameplays",
  Users: "/users",
  User: "/users/me",
  Memberships: "/memberships",
  Rewards: "/rewards",
  MenuCategories: "/menu/categories",
  MenuItems: "/menu/items",
  Menu: "/menu",
  Categories: "/categories",
  Items: "/items",
  AllUsers: "/users?all=true",
  Location: "/location",
  Login: "/login",
  Reservations: "/reservations",
  ReservationsCall: "/reservations/call",
  Tables: "/tables",
  Visits: "/visits",
  Accounting: "/accounting",
};

interface Props<T> {
  baseQuery: string;
  queryKey?: QueryKey;
  sortFunction?: (a: Partial<T>, b: Partial<T>) => number;
}

export function useGet<T>(path: string, queryKey?: QueryKey) {
  // We are using path as a query key if queryKey is not provided
  const fetchQueryKey = queryKey || [path];
  const { data } = useQuery(fetchQueryKey, () => get<T>({ path }));
  return data;
}

export function useGetList<T>(path: string, queryKey?: QueryKey) {
  return useGet<T[]>(path, queryKey) || [];
}

export function useMutationApi<T extends { _id: number | string }>({
  baseQuery,
  queryKey = [baseQuery],
  sortFunction,
}: Props<T>) {
  function createRequest(itemDetails: Partial<T>): Promise<T> {
    return post<Partial<T>, T>({
      path: baseQuery,
      payload: itemDetails,
    });
  }

  function deleteRequest(id: number): Promise<T> {
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

  function useCreateItemMutation() {
    const queryClient = useQueryClient();
    return useMutation(createRequest, {
      // We are updating tables query data with new item
      onMutate: async (itemDetails) => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries(queryKey);

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
      onError: (_err, _newTable, context) => {
        const previousItemContext = context as {
          previousItems: T[];
        };
        if (previousItemContext?.previousItems) {
          const { previousItems } = previousItemContext;
          queryClient.setQueryData<T[]>(queryKey, previousItems);
        }
      },
      // Always refetch after error or success:
      onSettled: async () => {
        queryClient.invalidateQueries(queryKey);
      },
    });
  }
  function useDeleteItemMutation() {
    const queryClient = useQueryClient();

    return useMutation(deleteRequest, {
      // We are updating tables query data with new item
      onMutate: async (id) => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries(queryKey);

        // Snapshot the previous value
        const previousItems = queryClient.getQueryData<T[]>(queryKey) || [];

        const updatedItems = previousItems.filter((item) => item._id !== id);
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
        setTimeout(() => toast.error("This item cannot be deleted"), 200);
      },
      // Always refetch after error or success:
      onSettled: async () => {
        queryClient.invalidateQueries(queryKey);
      },
    });
  }
  function useUpdateItemMutation() {
    const queryClient = useQueryClient();
    return useMutation(updateRequest, {
      // We are updating tables query data with new item
      onMutate: async ({ id, updates }: UpdatePayload<T>) => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries(queryKey);

        // Snapshot the previous value
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

        // Optimistically update to the new value
        queryClient.setQueryData(queryKey, updatedItems);

        // Return a context object with the snapshotted value
        return { previousItems };
      },
      // If the mutation fails, use the context returned from onMutate to roll back
      onError: (_err, _newTable, context) => {
        const previousItemContext = context as {
          previousItems: T[];
        };
        if (previousItemContext?.previousItems) {
          const { previousItems } = previousItemContext;
          queryClient.setQueryData<T[]>(queryKey, previousItems);
        }
      },
      // Always refetch after error or success:
      onSettled: async () => {
        queryClient.invalidateQueries(queryKey);
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
