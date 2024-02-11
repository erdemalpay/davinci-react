import { Input } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { Game, Gameplay } from "../../types";
import { useGetGames } from "../../utils/api/game";
import { Autocomplete } from "../common/Autocomplete";
type Props = {
  data: Gameplay[];
};
type GameplayAccumulator = {
  [key: number]: Gameplay[];
};
// In this component, we display the games that the user mentors within their gameplays.
const GameMasterGames = ({ data }: Props) => {
  const games: Game[] = useGetGames();
  const [gameFilter, setGameFilter] = useState<Game | null>();
  const [startDateFilter, setStartDateFilter] = useState<string | null>();
  const [endDateFilter, setEndDateFilter] = useState<string | null>();
  const gameplays = data.reduce<GameplayAccumulator>((acc, gameplay) => {
    if (!acc[gameplay.game as number]) {
      acc[gameplay.game as number] = [];
    }
    acc[gameplay.game as number].push(gameplay);
    return acc;
  }, {});

  const gameplayGroupRows = Object.entries(gameplays)
    .sort(([, sessionA], [, sessionB]) => sessionB.length - sessionA.length)
    .map(([game, session]) => ({
      game: Number(game),
      session: session,
    }));

  const [groupRow, setGroupRow] = useState(gameplayGroupRows);
  const countColumn = gameFilter
    ? ""
    : ` ${groupRow.length}/${groupRow?.reduce(
        (acc, row) => acc + row.session.length,
        0
      )}`;

  const columns = ["Game", countColumn];

  useEffect(() => {
    setGroupRow(() => {
      let searchData = gameplayGroupRows;
      if (gameFilter) {
        searchData = searchData.filter(
          (item) => String(item.game) === String(gameFilter?._id)
        );
      }

      if (startDateFilter || endDateFilter) {
        searchData = searchData
          .map((item) => ({
            ...item,
            session: item.session.filter((session) => {
              const sessionDate = new Date(session.date);
              const isAfterStartDate = startDateFilter
                ? sessionDate >= new Date(startDateFilter)
                : true;
              const isBeforeEndDate = endDateFilter
                ? sessionDate <= new Date(endDateFilter)
                : true;
              return isAfterStartDate && isBeforeEndDate;
            }),
          }))
          .filter((item) => item.session.length > 0); // Keep only items with at least one session matching the date filters
      }

      return searchData;
    });
  }, [gameFilter, startDateFilter, endDateFilter]);

  function handleGameSelection(game: Game) {
    setGameFilter(game);
  }

  return (
    <div className="self-auto w-full sm:w-1/3 flex flex-col gap-2">
      <div className="flex flex-col justify-between gap-4">
        <h1 className="font-semibold text-lg w-fit">Anlattığı Oyunlar</h1>
        <div className="flex flex-row gap-2">
          <Input
            variant="standard"
            name="startDay"
            label="After"
            type="date"
            onChange={(e) => setStartDateFilter(e.target.value)}
          />
          <Input
            variant="standard"
            name="endDay"
            label="Before"
            type="date"
            onChange={(e) => setEndDateFilter(e.target.value)}
          />
        </div>
      </div>

      <div className=" border rounded-md flex flex-col bg-white overflow-x-auto  font-[inter] max-h-[420px] overflow-y-auto shadow-sm ">
        <div className="overflow-auto">
          <Autocomplete
            name="game"
            label="Game"
            suggestions={games}
            handleSelection={handleGameSelection}
            showSelected
          />
          <table className="table-auto w-full">
            <thead className=" border-b">
              <tr className="ml-6 flex flex-row justify-between w-full ">
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
              {groupRow.length > 0 &&
                groupRow.map((row, index) => {
                  const game = games.find(
                    (game) => String(game._id) === String(row.game)
                  );
                  return (
                    <tr key={row.game} className="hover:bg-[#f7f7f8]">
                      {columns.map((column, columnIndex) => {
                        if (column === "Game") {
                          return (
                            <td
                              key={columnIndex + row.game}
                              className="px-4 py-4 whitespace-no-wrap  text-sm  font-[500] text-gray-900"
                            >
                              {game?.name}
                            </td>
                          );
                        } else {
                          return (
                            <td
                              key={columnIndex + row.game}
                              className="px-4 py-4 whitespace-no-wrap text-center text-sm  font-[500] text-gray-900"
                            >
                              {row.session.length}
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

export default GameMasterGames;
