import { useGetUser } from "../../../../utils/api/user";
import GameMaster from "../../../user/GameMaster";
import ItemContainer from "../../common/ItemContainer";

type Props = {};

const GameMasterProfile = (props: Props) => {
  const user = useGetUser();
  if (!user) return <></>;

  return (
    <ItemContainer>
      <GameMaster user={user} />
    </ItemContainer>
  );
};

export default GameMasterProfile;
