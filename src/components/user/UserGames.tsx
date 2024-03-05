import { User } from "../../types";
import { useGetMentorGamePlays } from "../../utils/api/gameplay";

import GamesIKnow from "../tables/GamesIKnow";
import GamesIMentored from "../tables/GamesIMentored";

type Props = {
  user: User;
};
const UserGames = ({ user }: Props) => {
  const { data } = useGetMentorGamePlays(user._id);

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data && <GamesIMentored data={data} />}
        <GamesIKnow userId={user._id} />
      </div>
    </div>
  );
};

export default UserGames;
