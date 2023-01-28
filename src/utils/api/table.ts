import { patch } from "./index";
import { Table } from "../../types/index";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { SelectedDateContext } from "../../context/SelectedDateContext";
import { sortTable } from "../sort";
import { LocationContext } from "../../context/LocationContext";
import { Paths, useGet, useMutationApi } from "./factory";

interface UpdateTablePayload {
  id: number;
  updates: Partial<Table>;
}

interface TablePayloadWithId {
  id: number;
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

export function reopenTable({ id }: TablePayloadWithId): Promise<Table> {
  return patch<Partial<Table>, Table>({
    path: `/tables/reopen/${id}`,
    payload: {},
  });
}

export function useCloseTableMutation() {
  const { selectedLocationId } = useContext(LocationContext);
  const { selectedDate } = useContext(SelectedDateContext);
  const queryKey = [BASE_URL, selectedLocationId, selectedDate];

  const queryClient = useQueryClient();
  return useMutation(closeTable, {
    // We are updating tables query data with new table
    onMutate: async ({ id, updates }: UpdateTablePayload) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(queryKey);

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
    onError: (_err, _newTable, context) => {
      const previousTableContext = context as { previousTables: Table[] };
      if (previousTableContext?.previousTables) {
        const { previousTables } = previousTableContext;
        queryClient.setQueryData<Table[]>(queryKey, previousTables);
      }
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(queryKey);
    },
  });
}

export function useReopenTableMutation() {
  const { selectedLocationId } = useContext(LocationContext);
  const { selectedDate } = useContext(SelectedDateContext);
  const queryKey = [BASE_URL, selectedLocationId, selectedDate];
  const queryClient = useQueryClient();
  return useMutation(reopenTable, {
    // We are updating tables query data with new table
    onMutate: async ({ id }: TablePayloadWithId) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(queryKey);

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
    onError: (_err, _newTable, context) => {
      const previousTableContext = context as { previousTables: Table[] };
      if (previousTableContext?.previousTables) {
        const { previousTables } = previousTableContext;
        queryClient.setQueryData<Table[]>(queryKey, previousTables);
      }
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(queryKey);
    },
  });
}

export function useTableMutations() {
  const { selectedLocationId } = useContext(LocationContext);
  const { selectedDate } = useContext(SelectedDateContext);

  const {
    deleteItem: deleteTable,
    updateItem: updateTable,
    createItem: createTable,
  } = useMutationApi<Table>({
    baseQuery: Paths.Tables,
    queryKey: [Paths.Tables, selectedLocationId, selectedDate],
    needsRevalidate: false,
  });
  return { deleteTable, updateTable, createTable };
}

export function useGetTables() {
  const { selectedLocationId } = useContext(LocationContext);
  const { selectedDate } = useContext(SelectedDateContext);
  return useGet<Table[]>(
    `${Paths.Tables}?location=${selectedLocationId}&date=${selectedDate}`,
    [Paths.Tables, selectedLocationId, selectedDate]
  );
}
