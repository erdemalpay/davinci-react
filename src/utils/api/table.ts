import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { useDateContext } from "../../context/Date.context";
import { useLocationContext } from "../../context/Location.context";
import { useOrderContext } from "../../context/Order.context";
import { Table } from "../../types/index";
import { sortTable } from "../sort";
import { Paths, useGet, useGetList, useMutationApi } from "./factory";
import { get, patch, post } from "./index";

interface UpdateTablePayload {
  id: number;
  updates: Partial<Table>;
}
interface CloseAllTablePayload {
  ids: number[];
  finishHour: string;
}

interface TablePayloadWithId {
  id: number;
}
interface TablePersonalCreatePayload {
  tableCount: number;
  createdBy: string | null;
}
const BASE_URL = `/tables`;

export function closeTable({
  id,
  updates,
}: UpdateTablePayload): Promise<Table> {
  return patch<Partial<Table>, Table>({
    path: `/tables/close/${id}`,
    payload: updates,
  });
}
export function closeAllTable({
  ids,
  finishHour,
}: CloseAllTablePayload): Promise<Table[]> {
  return patch<Partial<CloseAllTablePayload>, Table[]>({
    path: `/tables/closeAll`,
    payload: { ids, finishHour },
  });
}

export function reopenTable({ id }: TablePayloadWithId): Promise<Table> {
  return patch<Partial<Table>, Table>({
    path: `/tables/reopen/${id}`,
    payload: {},
  });
}

export function updateTable({
  id,
  updates,
}: UpdateTablePayload): Promise<Table> {
  return patch<Partial<Table>, Table>({
    path: `/tables/${id}`,
    payload: updates,
  });
}

export function useCloseTableMutation() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const queryKey = [Paths.Tables, selectedLocationId, selectedDate];

  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: closeTable,
    // We are updating tables query data with new table
    onMutate: async ({ id, updates }: UpdateTablePayload) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousTables = queryClient.getQueryData<Table[]>(queryKey) || [];
      const updatedTables = [...previousTables];

      for (let i = 0; i < updatedTables.length; i++) {
        if (updatedTables[i]._id === id) {
          updatedTables[i] = { ...updatedTables[i], ...updates };
        }
      }
      updatedTables.sort(sortTable);

      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, updatedTables);

      // Return a context object with the snapshotted value
      return { previousTables };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err: any, _newTable, context) => {
      const previousTableContext = context as { previousTables: Table[] };
      if (previousTableContext?.previousTables) {
        const { previousTables } = previousTableContext;
        queryClient.setQueryData<Table[]>(queryKey, previousTables);
      }
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
    // Update cache with server response on success
    onSettled: async (updatedTable, error, _variables, context) => {
      if (error || !updatedTable) return;

      const previousTableContext = context as { previousTables: Table[] };
      const updatedTables = (previousTableContext?.previousTables || []).map(
        (table) => (table._id === updatedTable._id ? updatedTable : table)
      );
      queryClient.setQueryData(queryKey, updatedTables);
    },
  });
}
export function useCloseAllTableMutation() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const queryKey = [Paths.Tables, selectedLocationId, selectedDate];

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closeAllTable,
    onMutate: async ({ ids, finishHour }: CloseAllTablePayload) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTables = queryClient.getQueryData<Table[]>(queryKey) || [];

      // Optimistically update tables to reflect they're closed
      const updatedTables = previousTables
        .map((table) => {
          if (ids.includes(table._id)) {
            return { ...table, finishHour };
          }
          return table;
        })
        .sort(sortTable);

      queryClient.setQueryData(queryKey, updatedTables);

      return { previousTables };
    },
    onError: (_err: any, _variables, context) => {
      // Rollback on error
      const previousTableContext = context as { previousTables: Table[] };
      if (previousTableContext?.previousTables) {
        queryClient.setQueryData(queryKey, previousTableContext.previousTables);
      }
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export function useReopenTableMutation() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const queryKey = [Paths.Tables, selectedLocationId, selectedDate];
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reopenTable,
    // We are updating tables query data with new table
    onMutate: async ({ id }: TablePayloadWithId) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousTables = queryClient.getQueryData<Table[]>(queryKey) || [];
      const updatedTables = [...previousTables];

      for (let i = 0; i < updatedTables.length; i++) {
        if (updatedTables[i]._id === id) {
          updatedTables[i] = { ...updatedTables[i], finishHour: undefined };
        }
      }
      updatedTables.sort(sortTable);

      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, updatedTables);

      // Return a context object with the snapshotted value
      return { previousTables };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err: any, _newTable, context) => {
      const previousTableContext = context as { previousTables: Table[] };
      if (previousTableContext?.previousTables) {
        const { previousTables } = previousTableContext;
        queryClient.setQueryData<Table[]>(queryKey, previousTables);
      }
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
    // Update cache with server response on success
    onSettled: async (updatedTable, error, _variables, context) => {
      if (error || !updatedTable) return;

      const previousTableContext = context as { previousTables: Table[] };
      const updatedTables = (previousTableContext?.previousTables || []).map(
        (table) => (table._id === updatedTable._id ? updatedTable : table)
      );
      queryClient.setQueryData(queryKey, updatedTables);
    },
  });
}

export function useUpdateTableMutation() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const queryKey = [Paths.Tables, selectedLocationId, selectedDate];

  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTable,
    onMutate: async ({ id, updates }: UpdateTablePayload) => {
      await queryClient.cancelQueries({ queryKey });

      const previousTables = queryClient.getQueryData<Table[]>(queryKey) || [];
      const updatedTables = previousTables.map((table) =>
        table._id === id ? { ...table, ...updates } : table
      );
      updatedTables.sort(sortTable);

      queryClient.setQueryData(queryKey, updatedTables);

      return { previousTables };
    },
    onError: (_err: any, _variables, context) => {
      const previousTableContext = context as { previousTables: Table[] };
      if (previousTableContext?.previousTables) {
        const { previousTables } = previousTableContext;
        queryClient.setQueryData<Table[]>(queryKey, previousTables);
      }
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
    // Update cache with server response on success
    onSettled: async (updatedTable, error, _variables, context) => {
      if (error || !updatedTable) return;

      const previousTableContext = context as { previousTables: Table[] };
      const updatedTables = (previousTableContext?.previousTables || []).map(
        (table) => (table._id === updatedTable._id ? updatedTable : table)
      );
      queryClient.setQueryData(queryKey, updatedTables);
    },
  });
}

export function useCreateTableMutation() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const queryKey = [Paths.Tables, selectedLocationId, selectedDate];
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) =>
      post<any, Table>({
        path: `${BASE_URL}`,
        payload,
      }),
    // We are updating tables query data with new table
    onMutate: async (itemDetails) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey });
      // Snapshot the previous value
      const previousItems = queryClient.getQueryData<Table[]>(queryKey);
      if (!previousItems) return;
      const updatedItems = [
        ...previousItems,
        {
          ...itemDetails.tableDto,
          ...itemDetails?.orders,
          tables:
            itemDetails?.tableDto?.tables !== ""
              ? itemDetails.tableDto.tables
              : [],
        },
      ];
      updatedItems.sort(sortTable);
      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, updatedItems);

      // Return a context object with the snapshotted value
      return { previousItems };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err: any, _newTable, context) => {
      const previousItemContext = context as {
        previousItems: Table[];
      };
      if (previousItemContext?.previousItems) {
        const { previousItems } = previousItemContext;
        queryClient.setQueryData<Table[]>(queryKey, previousItems);
      }
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
    // Always refetch after error or success:
    onSettled: async (newItem, error, _variables, context) => {
      const previousItemContext = context as {
        previousItems: Table[];
      };
      if (newItem) {
        const updatedItems = [
          ...(previousItemContext?.previousItems || []),
          newItem,
        ];
        queryClient.setQueryData(queryKey, updatedItems);
      }
    },
  });
}

export function useTableMutations() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();

  const { deleteItem: deleteTable } = useMutationApi<Table>({
    baseQuery: Paths.Tables,
    queryKey: [Paths.Tables, selectedLocationId, selectedDate],
    sortFunction: sortTable,
  });
  const { mutate: createTable } = useCreateTableMutation();
  const { mutate: updateTable } = useUpdateTableMutation();
  return { deleteTable, updateTable, createTable };
}

export function useGetPersonalTableCreateData() {
  const { filterPanelFormElements } = useOrderContext();
  return useGetList<TablePersonalCreatePayload>(
    `${Paths.Tables}/create_count?after=${filterPanelFormElements?.after}&before=${filterPanelFormElements?.before}`,
    [
      `${Paths.Tables}/create_count`,
      filterPanelFormElements?.after,
      filterPanelFormElements?.before,
    ],
    true
  );
}

export function useGetTable(id: number) {
  return useGet<Table>(`${Paths.Tables}/${id}`, [Paths.Tables, id], true);
}
export function useGetTables() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();

  const queryKey: QueryKey = [Paths.Tables, selectedLocationId, selectedDate];

  const queryFn = async (): Promise<Table[]> => {
    const tablesForLocation = await get<Table[]>({
      path: `${Paths.Tables}?location=${selectedLocationId}&date=${selectedDate}`,
    });
    return tablesForLocation;
  };

  const { data, refetch } = useQuery<Table[]>({
    queryKey,
    queryFn,
    staleTime: Infinity,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!selectedLocationId) return;
    // Refetch if data doesn't exist for this location/date combination
    if (!data) {
      refetch();
    }
  }, [selectedLocationId, selectedDate, data, refetch]);

  return (data ?? []) as Table[];
}

export function useGetTablePlayerCounts(month: string, year: string) {
  return useGetList<any>(
    `${Paths.Tables}/count?year=${year}&month=${month}`,
    [year, month],
    true
  );
}

export async function getOpenTableDates(
  location: number,
  dateFrom: string,
  dateTo: string
): Promise<string[]> {
  return get<string[]>({
    path: `${Paths.Tables}/open-dates?location=${location}&dateFrom=${dateFrom}&dateTo=${dateTo}`,
  });
}
