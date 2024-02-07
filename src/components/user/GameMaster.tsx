import { useGetGameplaysGroups } from "../../utils/api/gameplay";
import GameMasterGamesTable from "../tables/GameMasterGames";
import UserGamesTable from "../tables/UserGamesTable";

const GameMaster = () => {
  const { data } = useGetGameplaysGroups({
    groupBy: "mentor,game",
  });
  if (!data) return <></>;
  return (
    <div className="flex flex-col">
      <div className=" flex flex-row  gap-20  ">
        <GameMasterGamesTable data={data} />

        <UserGamesTable />
      </div>
    </div>
  );
};

export default GameMaster;
