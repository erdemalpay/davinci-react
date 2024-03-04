import { User } from "../../types";
import { useGetMentorGamePlays } from "../../utils/api/gameplay";
// import GameMasterGamesTable from "../tables/GameMasterGames";
import GamesIKnow from "../tables/GamesIKnow";
import GamesIMentored from "../tables/GamesIMentored";

type Props = {
  user: User;
};
const GameMaster = ({ user }: Props) => {
  const { data } = useGetMentorGamePlays(user._id);
  if (!data) return null;
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GamesIMentored data={data} />
        <GamesIKnow userId={user._id} />
      </div>
    </div>
  );
};

export default GameMaster;
