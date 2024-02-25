import { User } from "../../types";
import { useGetMentorGamePlays } from "../../utils/api/gameplay";
import GameMasterGamesTable from "../tables/GameMasterGames";
import UserGamesTable from "../tables/UserGamesTable";
type Props = {
  user: User;
};
const GameMaster = ({ user }: Props) => {
  const { data } = useGetMentorGamePlays(user._id);

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data && <GameMasterGamesTable data={data} />}
        <UserGamesTable userId={user._id} />
      </div>
    </div>
  );
};

export default GameMaster;
