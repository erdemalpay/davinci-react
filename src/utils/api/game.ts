import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch, UpdatePayload } from ".";
import { Game } from "../../types";
import { Paths, useGetList, useMutationApi } from "./factory";

const BASE_URL = `/games`;

export type MinimalGame = Pick<Game, "_id" | "name">;

export type RequestedGameRequest = {
  email: string;
  requestedAt: string;
};

export type RequestedGame = {
  _id: string;
  name: string;
  normalizedName: string;
  bggGameId?: number;
  totalRequestCount: number;
  requestList: RequestedGameRequest[];
  createdAt?: string;
  updatedAt?: string;
  status?: "requested" | "deleted" | "available";
};

export type RequestedGameStatus = NonNullable<RequestedGame["status"]>;

export function useGameMutations() {
  const {
    deleteItem: deleteGame,
    updateItem: updateGame,
    createItem: createGame,
  } = useMutationApi<Game>({
    baseQuery: Paths.Games,
  });

  return { deleteGame, updateGame, createGame };
}

function updateRequestedGameRequest({
  id,
  updates,
}: UpdatePayload<RequestedGame>) {
  return patch<Partial<RequestedGame>, RequestedGame>({
    path: `${BASE_URL}/requested/${id}`,
    payload: updates,
  });
}

export function useRequestedGameMutations() {
  const queryClient = useQueryClient();
  const { mutate: updateRequestedGame } = useMutation({
    mutationFn: updateRequestedGameRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_URL, "requested"] });
    },
  });

  return { updateRequestedGame };
}

export function useGetGames() {
  return useGetList<Game>(Paths.Games);
}
export function useGetGamesMinimal() {
  return useGetList<MinimalGame>(`${Paths.Games}/minimal`);
}

export function useGetGameDetails(gameId: number) {
  const getGameDetailsQuery = `${BASE_URL}/details/${gameId}`;
  const queryKey = [BASE_URL, "details", gameId];
  const { isLoading, error, data, isFetching } = useQuery({
    queryKey,
    queryFn: () => get<Game>({ path: getGameDetailsQuery }),
    refetchOnWindowFocus: false,
  });
  return {
    isLoading,
    error,
    gameDetails: data,
    isFetching,
  };
}

export function useGetRequestedGames(status?: RequestedGameStatus) {
  const requestedGamesUrl = `${BASE_URL}/requested`;
  const params = new URLSearchParams();

  if (status) {
    params.set("status", status);
  }

  const queryString = params.toString();
  const url = queryString
    ? `${requestedGamesUrl}?${queryString}`
    : requestedGamesUrl;

  return useGetList<RequestedGame>(url, [
    BASE_URL,
    "requested",
    status ?? "all",
  ]);
}
