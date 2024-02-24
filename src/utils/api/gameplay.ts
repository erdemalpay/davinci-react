import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDateContext } from "../../context/Date.context";
import { useLocationContext } from "../../context/Location.context";
import { Gameplay, Table } from "../../types/index";
import { sortTable } from "../sort";
import { get, patch, post, remove } from "./index";

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
  totalCount: number;
  items: Gameplay[];
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

export interface GameplayFilter {
  game?: number;
  mentor?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
  sort?: string;
  asc?: number;
}
export interface GameplayGroupFilter {
  groupBy: string;
  startDate?: string;
  endDate?: string;
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

export function updateGameplay({
  id,
  updates,
}: UpdateGameplayPayload): Promise<Gameplay> {
  return patch<Partial<Gameplay>, Gameplay>({
    path: `/gameplays/${id}`,
    payload: updates,
  });
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
export function useGetGameplays(filter: GameplayFilter) {
  const { startDate, endDate, game, mentor, limit, page, sort, asc } = filter;
  let query = `${BASE_URL_GAMEPLAYS}/query?page=${page}&limit=${limit}`;
  if (startDate) {
    query += `&startDate=${startDate}`;
  }
  if (endDate) {
    query += `&endDate=${endDate}`;
  }
  if (game) {
    query += `&game=${game}`;
  }
  if (mentor) {
    query += `&mentor=${mentor}`;
  }
  if (sort) {
    query += `&sort=${sort}`;
  }
  if (asc) {
    query += `&asc=${asc}`;
  }
  const queryKey = [
    BASE_URL_GAMEPLAYS,
    "query",
    page,
    limit,
    startDate,
    endDate,
    game,
    mentor,
    sort,
    asc,
  ];
  const { isLoading, error, data, isFetching } = useQuery(queryKey, () =>
    get<GameplayQueryResult>({ path: query })
  );
  return {
    isLoading,
    error,
    data,
    isFetching,
  };
}

export function useGetGameplaysGroups(filter: GameplayGroupFilter) {
  const { startDate, endDate, groupBy } = filter;
  let query = `${BASE_URL_GAMEPLAYS}/query-group?groupBy=${groupBy}`;
  if (startDate) {
    query += `&startDate=${startDate}`;
  }
  if (endDate) {
    query += `&endDate=${endDate}`;
  }
  const queryKey = [
    BASE_URL_GAMEPLAYS,
    "query-group",
    groupBy,
    startDate,
    endDate,
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

export function useCreateGameplayMutation() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const queryKey = [BASE_URL_TABLES, selectedLocationId, selectedDate];
  const queryClient = useQueryClient();
  return useMutation(createGameplay, {
    // We are updating tables query data with updated gameplay
    onMutate: async (newGameplay) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(queryKey);

      // Snapshot the previous value
      const previousTables = queryClient.getQueryData<Table[]>(queryKey);
      const previousTable = previousTables?.find(
        (table) => table._id === newGameplay.table
      );
      if (!previousTable) return { previousTables };

      const updatedTables = [
        ...(previousTables?.filter(
          (table) => table._id !== previousTable._id
        ) || []),
        {
          ...previousTable,
          gameplays: [...previousTable.gameplays, newGameplay.payload],
        },
      ];
      updatedTables.sort(sortTable);

      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, updatedTables);

      // Return a context object with the snapshotted value
      return { previousTables };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _newGameplay, context) => {
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

export function useUpdateGameplayMutation() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const queryKey = [BASE_URL_TABLES, selectedLocationId, selectedDate];
  const queryClient = useQueryClient();
  return useMutation(updateGameplay, {
    // We are updating tables query data with new gameplay
    onMutate: async ({ tableId, id, updates }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(queryKey);

      // Snapshot the previous value
      const previousTables = queryClient.getQueryData<Table[]>(queryKey);
      const gameplaysTable = previousTables?.find(
        (table) => table._id === tableId
      );
      if (!gameplaysTable) return { previousTables };
      const updatedGameplay = gameplaysTable.gameplays.find(
        (gameplay) => gameplay._id === id
      );
      if (!updatedGameplay) return { previousTables };

      const updatedTables: Table[] = [
        ...(previousTables?.filter(
          (table) => table._id !== gameplaysTable._id
        ) || []),
        {
          ...gameplaysTable,
          gameplays: [
            ...gameplaysTable.gameplays.filter(
              (gameplay) => gameplay._id !== id
            ),
            {
              ...updatedGameplay,
              ...updates,
            },
          ],
        },
      ];
      updatedTables.sort(sortTable);

      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, updatedTables);

      // Return a context object with the snapshotted value
      return { previousTables };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _newGameplay, context) => {
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

export function useDeleteGameplayMutation() {
  const queryClient = useQueryClient();
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const queryKey = [BASE_URL_TABLES, selectedLocationId, selectedDate];
  return useMutation(deleteGameplay, {
    // We are updating tables query data with delete gameplay
    onMutate: async ({ tableId, id }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(queryKey);

      // Snapshot the previous value
      const previousTables = queryClient.getQueryData<Table[]>(queryKey);
      const gameplaysTable = previousTables?.find(
        (table) => table._id === tableId
      );
      if (!gameplaysTable) return { previousTables };

      const updatedTables = [
        ...(previousTables?.filter(
          (table) => table._id !== gameplaysTable._id
        ) || []),
        {
          ...gameplaysTable,
          gameplays: [
            ...gameplaysTable.gameplays.filter(
              (gameplay) => gameplay._id !== id
            ),
          ],
        },
      ];

      updatedTables.sort(sortTable);

      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, updatedTables);

      // Return a context object with the snapshotted value
      return { previousTables };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _newGameplay, context) => {
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
