import { useEffect, useState } from "react";
import { MdDelete } from "react-icons/md";
import { useUserContext } from "../../context/User.context";
import { Game, UserGameUpdateType } from "../../types";
import { useGetGames } from "../../utils/api/game";
import {
  updateUserGamesMutation,
  useGetUserWithId,
} from "../../utils/api/user";
import { Autocomplete } from "../common/Autocomplete";

enum UserGamesTableColumn {
  GAME = "Game",
  ACTION = "",
}
type Props = {
  userId: string;
};

// In this component we show the games that user added to their profile
const UserGamesTable = ({ userId }: Props) => {
  const { user: panelUser } = useUserContext();
  if (!panelUser) return <></>;
  const user = useGetUserWithId(userId);

  const games: Game[] = useGetGames();
  const [gameFilter, setGameFilter] = useState<Game | null>();
  const [groupRow, setGroupRow] = useState<Game[]>([]);
  const columns = [UserGamesTableColumn.GAME, UserGamesTableColumn.ACTION];
  const { updateUserGame } = updateUserGamesMutation();

  // when the filter, games or user changes, we update the groupRow
  useEffect(() => {
    setGroupRow(() => {
      const formattedData = games.filter((game) =>
        user?.games.includes(game._id)
      );
      if (gameFilter) {
        return games.filter(
          (item) => String(item._id) === String(gameFilter?._id)
        );
      }
      return formattedData;
    });
  }, [gameFilter, games, user]);

  // when the user clicks on the add or delete button, we update the user games
  function handleUpdateUserGame({
    gameId,
    updateType,
  }: {
    gameId: number;
    updateType: UserGameUpdateType;
  }) {
    updateUserGame({ gameId, updateType, userId });
  }
  function handleGameSelection(game: Game) {
    setGameFilter(game);
    if (panelUser?._id !== userId) return;
    if (user?.games?.includes(game?._id) || !game) return;
    handleUpdateUserGame({
      gameId: game?._id,
      updateType: UserGameUpdateType.ADD,
    });
  }

  return (
    <div className="w-full  h-fit ">
      <h1 className="font-semibold text-lg">Known Games</h1>
      <div className="border rounded-t-md pt-1 mt-2">
        <Autocomplete
          name="game"
          label="Game"
          suggestions={games}
          handleSelection={handleGameSelection}
          showSelected
        />
      </div>

      <div className="  border rounded-md flex flex-col bg-white overflow-x-auto  font-[inter] max-h-[420px] overflow-y-auto shadow-sm ">
        <div>
          <table className="table-auto w-full mx-auto ">
            <thead className=" border-b">
              <tr className="flex flex-row justify-between  w-full">
                {columns.map((column) => {
                  return (
                    <th
                      key={column}
                      className="  pl-2 py-4 text-sm font-[600]  text-gray-900  "
                    >
                      {column}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200  ">
              {groupRow.map((game) => {
                return (
                  <tr key={game._id} className="hover:bg-[#f7f7f8]">
                    {columns.map((column, columnIndex) => {
                      if (column === "Game") {
                        return (
                          <td
                            key={columnIndex + game.name}
                            className="px-4 py-4 whitespace-no-wrap  text-sm  font-[500] text-gray-900"
                          >
                            {game.name}
                          </td>
                        );
                      } else {
                        return (
                          <td
                            key={columnIndex + game._id}
                            className=" py-4 whitespace-no-wrap text-center text-sm  font-[500] text-gray-900"
                          >
                            {user?._id === panelUser?._id &&
                              user?.games.includes(game._id) && (
                                <button
                                  className="text-lg"
                                  onClick={() => {
                                    handleUpdateUserGame({
                                      gameId: game._id,
                                      updateType: UserGameUpdateType.REMOVE,
                                    });
                                  }}
                                >
                                  <MdDelete />
                                </button>
                              )}
                          </td>
                        );
                      }
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserGamesTable;
