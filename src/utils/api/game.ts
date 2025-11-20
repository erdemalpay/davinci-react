import { useQuery } from "@tanstack/react-query";
import { get } from ".";
import { Game } from "../../types";
import { Paths, useGetList, useMutationApi } from "./factory";

const BASE_URL = `/games`;

export type MinimalGame = Pick<Game, "_id" | "name">;

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

export function useGetGames() {
  return useGetList<Game>(Paths.Games);
}
export function useGetGamesMinimal() {
  return useGetList<MinimalGame>(`${Paths.Games}/minimal`);
}

export function useGetGameDetails(gameId: number) {
  const getGameDetailsQuery = `${BASE_URL}/details/${gameId}`;
  const queryKey = [BASE_URL, "details", gameId];
  const { isLoading, error, data, isFetching } = useQuery(queryKey, () =>
      get<Game>({ path: getGameDetailsQuery }),
    {
      refetchOnWindowFocus: false,
    }
  );
  return {
    isLoading,
    error,
    gameDetails: data,
    isFetching,
  };
}
