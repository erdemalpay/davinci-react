import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
  const [rows, setRows] = useState(gameplayGroupRows);
  const [countColumn, setCountColumn] = useState<string>(
    ` ${rows.length}/${rows?.reduce((acc, row) => acc + row.sessionLength, 0)}`
  );

  const columns = [
    { key: t("Game"), isSortable: true },
    { key: countColumn, isSortable: true },
  ];

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
    setCountColumn(
      ` ${filterData.length}/${filterData?.reduce(
        (acc, row) => acc + row.sessionLength,
        0
      )}`
    );
  };
  useEffect(() => {
    handleFilter();
  }, [startDateFilter, endDateFilter]);

  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [rows, countColumn]);

  const filters = [
    {
      isUpperSide: false,

      node: (
        <div className=" flex flex-col sm:flex-row gap-2   ">
          <input
            className="border px-2 rounded-md"
            type="date"
            name="startDay"
            value={startDateFilter ?? ""}
            onChange={(e) => {
              setStartDateFilter(e.target.value);
            }}
          />
          <span className="mx-auto sm:mx-0">to</span>
          <input
            className="border px-2 rounded-md"
            name="endDay"
            type="date"
            value={endDateFilter ?? ""}
            onChange={(e) => {
              setEndDateFilter(e.target.value);
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
      {games && (
        <GenericTable
          key={tableKey}
          columns={columns}
          rows={rows}
          rowKeys={rowKeys}
          title={t("Mentored Games")}
          filters={filters}
          isActionsActive={false}
        />
      )}
    </div>
  );
};

export default GamesIMentored;
