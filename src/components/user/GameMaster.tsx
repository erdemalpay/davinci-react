import { User } from "../../types";
import { useGetMentorGamePlays } from "../../utils/api/gameplay";
import UserGamesTable from "../tables/UserGamesTable";
type Props = {
  user: User;
};
const GameMaster = ({ user }: Props) => {
  const { data } = useGetMentorGamePlays(user._id);
  console.log(data);

  return (
    <div className="flex flex-col">
      <div className=" flex flex-row  gap-20  ">
        {/* <GameMasterGamesTable data={data} /> */}
        <UserGamesTable userId={user._id} />
      </div>
    </div>
  );
};

export default GameMaster;
