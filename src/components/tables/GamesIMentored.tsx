import { useState } from "react";
import { Game, Gameplay } from "../../types";
import { useGetGames } from "../../utils/api/game";
import GenericTable from "../panelComponents/Tables/GenericTable";

type Props = {
  data: Gameplay[];
};

type GameplayAccumulator = {
  [key: number]: Gameplay[];
};
const GamesIMentored = ({ data }: Props) => {
  const games: Game[] = useGetGames();
  const [tableKey, setTableKey] = useState(0);
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
      game: games.find((g) => g._id === Number(game))?.name as string,
      sessionLength: session.length,
    }));
  const countColumn = ` ${gameplayGroupRows.length}/${gameplayGroupRows?.reduce(
    (acc, row) => acc + row.sessionLength,
    0
  )}`;

  const columns = ["Game", `${countColumn}`];
  const [rows, setRows] = useState(gameplayGroupRows);
  const handleFilter = () => {
    const filterData = Object.entries(gameplays)
      .sort(([, sessionA], [, sessionB]) => sessionB.length - sessionA.length)
      .map(([game, session]) => ({
        game: games.find((g) => g._id === Number(game))?.name as string,
        session: session,
      }))
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
      .filter((item) => item.session.length > 0)
      .map((item) => ({
        game: item.game,
        sessionLength: item.session.length,
      }));
    setRows(filterData);
    setTableKey((prev) => prev + 1);
  };
  const filters = [
    {
      node: (
        <div className=" flex flex-row gap-2 overflow-hidden  ">
          <input
            className="border px-2 rounded-md"
            type="date"
            name="startDay"
            value={startDateFilter ?? ""}
            onChange={(e) => {
              setStartDateFilter(e.target.value);
              handleFilter();
              console.log(e.target.value);
            }}
          />
          <span>to</span>
          <input
            className="border px-2 rounded-md"
            name="endDay"
            type="date"
            value={endDateFilter ?? ""}
            onChange={(e) => {
              setEndDateFilter(e.target.value);
              handleFilter();
            }}
          />
        </div>
      ),
    },
  ];
  const rowKeys = [
    {
      key: "game",
    },
    {
      key: "sessionLength",
    },
  ];

  return (
    <div className="w-full  h-fit">
      <GenericTable
        key={tableKey}
        columns={columns}
        rows={rows}
        rowKeys={rowKeys}
        title={"Games Mentored"}
        filters={filters}
      />
    </div>
  );
};

export default GamesIMentored;
