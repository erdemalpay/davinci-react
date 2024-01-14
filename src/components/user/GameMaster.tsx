import { User } from "../../types";
import { useGetGames } from "../../utils/api/game";
import { useGetGameplaysGroups } from "../../utils/api/gameplay";
import GameMasterGames from "../tables/GameMasterGames";

type Props = {
  user: User;
};

const GameMaster = ({ user }: Props) => {
  const games = useGetGames();
  const { data } = useGetGameplaysGroups({
    groupBy: "mentor,game",
  });
  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-start ">
        {data && games && (
          <GameMasterGames user={user} games={games} data={data} />
        )}
      </div>
    </div>
  );
};

export default GameMaster;
