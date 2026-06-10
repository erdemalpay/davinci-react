import { format, startOfMonth } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Gameplay } from "../../types";
import { useGetGamesMinimal } from "../../utils/api/game";
import { QuickDateRangeFilter } from "../common/QuickDateRangeFilter";
import GenericTable from "../panelComponents/Tables/GenericTable";

const defaultStartDate = format(startOfMonth(new Date()), "yyyy-MM-dd");

type Props = {
  data: Gameplay[];
};

type GameplayAccumulator = {
  [key: number]: Gameplay[];
};

const GamesIMentored = ({ data }: Props) => {
  const { t } = useTranslation();
  const games = useGetGamesMinimal();
  const [startDateFilter, setStartDateFilter] =
    useState<string>(defaultStartDate);
  const [endDateFilter, setEndDateFilter] = useState<string>("");

  const gameplays = useMemo(() => {
    return data.reduce<GameplayAccumulator>((acc, gameplay) => {
      if (!acc[gameplay.game as number]) {
        acc[gameplay.game as number] = [];
      }
      acc[gameplay.game as number].push(gameplay);
      return acc;
    }, {});
  }, [data]);

  const rows = useMemo(() => {
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
    return filterData;
  }, [gameplays, games, startDateFilter, endDateFilter]);

  const countColumn = useMemo(() => {
    return ` ${rows.length}/${rows?.reduce(
      (acc, row) => acc + row.sessionLength,
      0
    )}`;
  }, [rows]);

  const columns = useMemo(
    () => [
      { key: t("Game"), isSortable: true },
      { key: countColumn, isSortable: true },
    ],
    [t, countColumn]
  );

  const filters = useMemo(
    () => [
      {
        isUpperSide: true,
        node: (
          <QuickDateRangeFilter
            startDate={startDateFilter}
            endDate={endDateFilter}
            onChange={(start: string, end: string) => {
              const isReset = !start && !end;
              setStartDateFilter(isReset ? defaultStartDate : start);
              setEndDateFilter(isReset ? "" : end);
            }}
          />
        ),
      },
    ],
    [startDateFilter, endDateFilter]
  );
  const rowKeys = useMemo(
    () => [
      {
        key: "game",
      },
      {
        key: "sessionLength",
      },
    ],
    []
  );

  return (
    <div className="w-full  h-fit">
      {games && (
        <GenericTable
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
