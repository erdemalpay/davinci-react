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
      <div className=" flex flex-row  gap-20  ">
        {data && <GameMasterGamesTable data={data} />}
        <UserGamesTable userId={user._id} />
      </div>
    </div>
  );
};

export default GameMaster;
