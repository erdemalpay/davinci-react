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
  const rows = gameplayGroupRows;
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
        columns={columns}
        rows={rows}
        rowKeys={rowKeys}
        title={"Games Mentored"}
      />
    </div>
  );
};

export default GamesIMentored;
