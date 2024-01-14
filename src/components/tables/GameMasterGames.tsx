import { useEffect, useState } from "react";
import { GameplayGroupRow } from "../../pages/GameplaysByMentor";
import { Game, User } from "../../types";
import { GameplayGroupQueryResult } from "../../utils/api/gameplay";
import { Autocomplete } from "../common/Autocomplete";
type Props = {
  user: User;
  games: Game[];
  data: GameplayGroupQueryResult[];
};

const GameMasterGames = ({ user, games, data }: Props) => {
  const [gameFilter, setGameFilter] = useState<Game | null>();
  const formattedData = data
    .map(({ secondary, total, _id }) => ({
      mentor: _id,
      total,
      secondary,
      open: false,
    }))
    .filter((row) => row.mentor === user._id);
  const gameplayGroupRows: GameplayGroupRow[] = formattedData.sort(
    (a, b) => Number(b.total) - Number(a.total)
  );
  const [groupRow, setGroupRow] = useState<GameplayGroupRow>(
    gameplayGroupRows[0]
  );
  const countColumn = gameFilter
    ? ""
    : ` ${groupRow?.secondary.length}/${groupRow?.total}`;
  const columns = ["Game", countColumn];
  useEffect(() => {
    setGroupRow(() => {
      const searchData = formattedData;
      if (gameFilter) {
        searchData[0].secondary = formattedData[0].secondary.filter(
          (item) => String(item.field) === String(gameFilter?._id)
        );
      }

      return searchData[0];
    });
  }, [gameFilter]);

  function handleGameSelection(game: Game) {
    setGameFilter(game);
  }

  return (
    <div className="w-full sm:w-1/3 border rounded-md flex flex-col bg-white overflow-x-auto  font-[inter] max-h-[420px] overflow-y-auto shadow-sm">
      <div className="overflow-auto">
        <Autocomplete
          name="game"
          label="Game"
          suggestions={games}
          handleSelection={handleGameSelection}
          showSelected
        />
        <table className="table-auto w-full mx-auto">
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

          <tbody className="bg-white divide-y divide-gray-200">
            {groupRow.secondary.length > 0 &&
              groupRow.secondary.map((second, index) => {
                const game = games.find(
                  (game) => String(game._id) === String(second.field)
                );
                return (
                  <tr key={second.field} className="hover:bg-[#f7f7f8]">
                    {columns.map((column, columnIndex) => {
                      if (column === "Game") {
                        return (
                          <td
                            key={columnIndex + second.field}
                            className="px-4 py-4 whitespace-no-wrap  text-sm  font-[500] text-gray-900"
                          >
                            {game?.name}
                          </td>
                        );
                      } else {
                        return (
                          <td
                            key={columnIndex + second.field}
                            className="py-4 whitespace-no-wrap text-center text-sm  font-[500] text-gray-900"
                          >
                            {second.count}
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
  );
};

export default GameMasterGames;
