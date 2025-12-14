import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useDateContext } from "../../context/Date.context";
import { useLocationContext } from "../../context/Location.context";
import { FormElementsState, Gameplay, Table } from "../../types/index";
import { sortTable } from "../sort";
import { useOrderContext } from "./../../context/Order.context";
import { Paths, useGet, useGetList } from "./factory";
import { get, patch, post, remove } from "./index";
import { TablesByLocation } from "./table";

const BASE_URL_GAMEPLAYS = "/gameplays";
const BASE_URL_TABLES = "/tables";

interface GameplayCreateRequest {
  table: number;
  payload: Gameplay;
}

interface UpdateGameplayPayload {
  tableId: number;
  id: number;
  updates: Partial<Gameplay>;
}

interface DeleteGameplayPayload {
  tableId: number;
  id: number;
}

interface GameplayAnalytic {
  _id: number | string;
  playCount: number;
  uniqueCount: number;
}

export interface GameplayQueryResult {
  data: Gameplay[];
  totalNumber: number;
  totalPages: number;
  page: number;
  limit: number;
}

interface GameplaySecondaryGroupResult {
  field: string;
  count: number;
}

export interface GameplayGroupQueryResult {
  total: number;
  secondary: GameplaySecondaryGroupResult[];
  _id: string;
  location?: number;
}

interface GameplayPersonalCreatePayload {
  gameplayCount: number;
  createdBy: string;
}
interface GameplayPersonalMentoredPayload {
  gameplayCount: number;
  mentoredBy: string;
  totalNarrationDurationPoint: number;
}

export interface GameplayFilter {
  game?: number;
  mentor?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
  sort?: string;
  asc?: number;
  location?: number;
}
export interface GameplayGroupFilter {
  groupBy: string;
  startDate?: string;
  endDate?: string;
  location?: string;
}

export interface GameplayCountByDate {
  value: number;
  day: string;
}

export function createGameplay({
  table,
  payload,
}: GameplayCreateRequest): Promise<Gameplay> {
  return post<Gameplay, Gameplay>({
    path: `/tables/${table}/gameplay`,
    payload,
  });
}

export async function updateGameplay({
  id,
  updates,
}: UpdateGameplayPayload): Promise<Gameplay> {
  const response: any = await patch<Partial<Gameplay>, Gameplay>({
    path: `/gameplays/${id}`,
    payload: updates,
  });
  return response.data;
}

export function deleteGameplay({
  tableId,
  id,
}: DeleteGameplayPayload): Promise<void> {
  return remove<void>({
    path: `/tables/${tableId}/gameplay/${id}`,
  });
}

// Client side access analtyics using this helper method
export function useGetGameplayAnalytics(
  field: string,
  limit: number,
  startDate: string,
  location: string,
  endDate?: string,
  mentor?: string
) {
  let query = `${BASE_URL_GAMEPLAYS}/group?location=${location}&startDate=${startDate}&field=${field}&limit=${limit}`;
  if (endDate) {
    query += `&endDate=${endDate}`;
  }
  if (mentor) {
    query += `&mentor=${mentor}`;
  }

  const queryKey = [
    BASE_URL_GAMEPLAYS,
    "group",
    location,
    startDate,
    field,
    limit,
    endDate,
    mentor,
  ];
  const { isLoading, error, data, isFetching } = useQuery(queryKey, () =>
    get<GameplayAnalytic[]>({ path: query })
  );
  return {
    isLoading,
    error,
    data,
    isFetching,
  };
}
export function useGetMentorGamePlays(mentorId: string) {
  const query = `${BASE_URL_GAMEPLAYS}/mentor/${mentorId}`;
  const queryKey = [BASE_URL_GAMEPLAYS, "mentor", mentorId];
  const { isLoading, error, data, isFetching } = useQuery(queryKey, () =>
    get<Gameplay[]>({ path: query })
  );
  return {
    isLoading,
    error,
    data,
    isFetching,
  };
}
export function useGetGameplays(
  page: number,
  limit: number,
  filters: FormElementsState
) {
  const parts = [
    `page=${page}`,
    `limit=${limit}`,
    filters.startDate && `startDate=${filters.startDate}`,
    filters.endDate && `endDate=${filters.endDate}`,
    filters.game && `game=${filters.game}`,
    filters.mentor && `mentor=${filters.mentor}`,
    filters.location && `location=${filters.location}`,
    filters.sort && `sort=${filters.sort}`,
    filters.asc !== undefined && `asc=${filters.asc}`,
    filters.search && `search=${filters.search.trim()}`,
  ];

  const queryString = parts.filter(Boolean).join("&");
  const url = `${BASE_URL_GAMEPLAYS}/query?${queryString}`;

  return useGet<GameplayQueryResult>(url, [url, page, limit, filters], true);
}

export function useGetGameplaysGroups(filter: GameplayGroupFilter) {
  const { startDate, endDate, groupBy, location } = filter;
  let query = `${BASE_URL_GAMEPLAYS}/query-group?groupBy=${groupBy}`;
  if (startDate) {
    query += `&startDate=${startDate}`;
  }
  if (endDate) {
    query += `&endDate=${endDate}`;
  }
  if (location) {
    query += `&location=${location}`;
  }
  const queryKey = [
    BASE_URL_GAMEPLAYS,
    "query-group",
    groupBy,
    startDate,
    endDate,
    location,
  ];

  const { isLoading, error, data, isFetching } = useQuery(
    queryKey,
    () => get<GameplayGroupQueryResult[]>({ path: query }),
    { refetchOnWindowFocus: false }
  );
  return {
    isLoading,
    error,
    data,
    isFetching,
  };
}
export function useGetGamePlaysGroupByLocation() {
  const queryKey = [BASE_URL_GAMEPLAYS, "group-game-mentor-location"];
  const { isLoading, error, data, isFetching } = useQuery(queryKey, () =>
    get<GameplayGroupQueryResult[]>({
      path: `${BASE_URL_GAMEPLAYS}/group-game-mentor-location`,
    })
  );
  return {
    isLoading,
    error,
    data,
    isFetching,
  };
}

export function useGetGameplayCountsByDate(mentorId: string) {
  const url = `${BASE_URL_GAMEPLAYS}/counts-by-date?mentorId=${mentorId}`;
  const queryKey = [BASE_URL_GAMEPLAYS, "counts-by-date", mentorId];

  const { isLoading, error, data, isFetching } = useQuery(
    queryKey,
    () => get<GameplayCountByDate[]>({ path: url }),
    { refetchOnWindowFocus: false }
  );

  return {
    isLoading,
    error,
    data,
    isFetching,
  };
}

export function useCreateGameplayMutation() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const queryClient = useQueryClient();

  const tablesQueryKey: QueryKey = [Paths.Tables, selectedDate];

  return useMutation(createGameplay, {
    onMutate: async (newGameplay) => {
      await queryClient.cancelQueries({ queryKey: tablesQueryKey });
      const previousByLocation =
        queryClient.getQueryData<TablesByLocation>(tablesQueryKey);

      const locationId = selectedLocationId;

      const prevForLocation = previousByLocation?.[locationId];

      if (!previousByLocation || !prevForLocation) {
        return { previousByLocation };
      }

      const previousTable = prevForLocation.find(
        (table) => table._id === newGameplay.table
      );

      if (!previousTable) {
        return { previousByLocation };
      }

      const updatedTable: Table = {
        ...previousTable,
        gameplays: [...previousTable.gameplays, newGameplay.payload],
      };

      const updatedTablesForLocation = [
        ...prevForLocation.filter((table) => table._id !== previousTable._id),
        updatedTable,
      ].sort(sortTable);

      const updatedByLocation: TablesByLocation = {
        ...previousByLocation,
        [locationId]: updatedTablesForLocation,
      };

      queryClient.setQueryData<TablesByLocation>(
        tablesQueryKey,
        updatedByLocation
      );
      queryClient.setQueryData<TablesByLocation>(
        tablesQueryKey,
        updatedByLocation
      );

      return { previousByLocation };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousByLocation) {
        queryClient.setQueryData<TablesByLocation>(
          [Paths.Tables, selectedDate],
          context.previousByLocation
        );
      }
    },

    onSettled: (
      data: Gameplay | undefined,
      error: unknown,
      variables: GameplayCreateRequest,
      context: { previousByLocation: TablesByLocation | undefined } | undefined
    ) => {
      if (!error && data && context?.previousByLocation) {
        const previousByLocation = context.previousByLocation;
        const locationId = selectedLocationId;
        const prevForLocation = previousByLocation?.[locationId];
        if (prevForLocation) {
          const previousTable = prevForLocation.find(
            (table) => table._id === variables.table
          );

          if (previousTable) {
            const updatedTable: Table = {
              ...previousTable,
              gameplays: [...previousTable.gameplays, data],
            };

            const updatedTablesForLocation = [
              ...prevForLocation.filter(
                (table) => table._id !== previousTable._id
              ),
              updatedTable,
            ].sort(sortTable);

            const updatedByLocation: TablesByLocation = {
              ...previousByLocation,
              [locationId]: updatedTablesForLocation,
            };

            queryClient.setQueryData<TablesByLocation>(
              tablesQueryKey,
              updatedByLocation
            );
          }
        }
      }
    },
  });
}
export function useUpdateGameplayMutation() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const queryClient = useQueryClient();

  const tablesQueryKey: QueryKey = [Paths.Tables, selectedDate];

  return useMutation(updateGameplay, {
    // We are updating tables query data with updated gameplay
    onMutate: async ({ tableId, id, updates }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: tablesQueryKey });

      // Snapshot the previous value
      const previousByLocation =
        queryClient.getQueryData<TablesByLocation>(tablesQueryKey);

      const locationId = selectedLocationId;
      const prevForLocation = previousByLocation?.[locationId];

      if (!previousByLocation || !prevForLocation) {
        return { previousByLocation };
      }

      const previousTable = prevForLocation.find(
        (table) => table._id === tableId
      );

      if (!previousTable) {
        return { previousByLocation };
      }

      // Use .map() to update in place, preserving order
      const updatedTable: Table = {
        ...previousTable,
        gameplays: previousTable.gameplays.map((gameplay) =>
          gameplay._id === id
            ? {
                ...gameplay,
                ...updates,
              }
            : gameplay
        ),
      };
      const updatedTablesForLocation = [
        ...prevForLocation.filter((table) => table._id !== previousTable._id),
        updatedTable,
      ].sort(sortTable);

      const updatedByLocation: TablesByLocation = {
        ...previousByLocation,
        [locationId]: updatedTablesForLocation,
      };

      queryClient.setQueryData<TablesByLocation>(
        tablesQueryKey,
        updatedByLocation
      );

      return { previousByLocation };
    },

    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err: any, _variables, context) => {
      if (context?.previousByLocation) {
        queryClient.setQueryData<TablesByLocation>(
          tablesQueryKey,
          context.previousByLocation
        );
      }
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },

    // Update with server response on success
    onSettled: (
      data: Gameplay | undefined,
      error: unknown,
      variables: UpdateGameplayPayload,
      context: { previousByLocation: TablesByLocation | undefined } | undefined
    ) => {
      if (!error && data && context?.previousByLocation) {
        const previousByLocation = context.previousByLocation;
        const locationId = selectedLocationId;
        const prevForLocation = previousByLocation?.[locationId];

        if (prevForLocation) {
          const previousTable = prevForLocation.find(
            (table) => table._id === variables.tableId
          );

          if (previousTable) {
            // Use .map() to update in place, preserving order
            const updatedTable: Table = {
              ...previousTable,
              gameplays: previousTable.gameplays.map((gameplay) =>
                gameplay._id === variables.id ? data : gameplay
              ),
            };

            const updatedTablesForLocation = [
              ...prevForLocation.filter(
                (table) => table._id !== previousTable._id
              ),
              updatedTable,
            ].sort(sortTable);

            const updatedByLocation: TablesByLocation = {
              ...previousByLocation,
              [locationId]: updatedTablesForLocation,
            };

            queryClient.setQueryData<TablesByLocation>(
              tablesQueryKey,
              updatedByLocation
            );
          }
        }
      }
    },
  });
}

export function useDeleteGameplayMutation() {
  const queryClient = useQueryClient();
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();

  const tablesQueryKey: QueryKey = [Paths.Tables, selectedDate];

  return useMutation(deleteGameplay, {
    // We are updating tables query data with deleted gameplay
    onMutate: async ({ tableId, id }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: tablesQueryKey });

      // Snapshot the previous value
      const previousByLocation =
        queryClient.getQueryData<TablesByLocation>(tablesQueryKey);

      const locationId = selectedLocationId;
      const prevForLocation = previousByLocation?.[locationId];

      if (!previousByLocation || !prevForLocation) {
        return { previousByLocation };
      }

      const previousTable = prevForLocation.find(
        (table) => table._id === tableId
      );

      if (!previousTable) {
        return { previousByLocation };
      }

      const updatedTable: Table = {
        ...previousTable,
        gameplays: previousTable.gameplays.filter(
          (gameplay) => gameplay._id !== id
        ),
      };

      const updatedTablesForLocation = [
        ...prevForLocation.filter((table) => table._id !== previousTable._id),
        updatedTable,
      ].sort(sortTable);

      const updatedByLocation: TablesByLocation = {
        ...previousByLocation,
        [locationId]: updatedTablesForLocation,
      };

      queryClient.setQueryData<TablesByLocation>(
        tablesQueryKey,
        updatedByLocation
      );

      return { previousByLocation };
    },

    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err: any, _variables, context) => {
      if (context?.previousByLocation) {
        queryClient.setQueryData<TablesByLocation>(
          tablesQueryKey,
          context.previousByLocation
        );
      }
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export function useGetPersonalGameplayCreateData() {
  const { filterPanelFormElements } = useOrderContext();
  return useGetList<GameplayPersonalCreatePayload>(
    `${BASE_URL_GAMEPLAYS}/create_count?after=${filterPanelFormElements.after}&before=${filterPanelFormElements.before}`,
    [
      `${{ BASE_URL_GAMEPLAYS }}/create_count`,
      filterPanelFormElements.after,
      filterPanelFormElements.before,
    ],
    true
  );
}

export function useGetPersonalGameplayMentoredData() {
  const { filterPanelFormElements } = useOrderContext();
  return useGetList<GameplayPersonalMentoredPayload>(
    `${BASE_URL_GAMEPLAYS}/mentored_count?after=${filterPanelFormElements.after}&before=${filterPanelFormElements.before}`,
    [
      `${{ BASE_URL_GAMEPLAYS }}/mentored_count`,
      filterPanelFormElements.after,
      filterPanelFormElements.before,
    ],
    true
  );
}
