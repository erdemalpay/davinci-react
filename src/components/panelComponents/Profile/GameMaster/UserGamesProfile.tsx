import { useGetUser } from "../../../../utils/api/user";
import UserGames from "../../../user/UserGames";
import ItemContainer from "../../common/ItemContainer";

type Props = {};

const UserGamesProfile = (props: Props) => {
  const user = useGetUser();
  if (!user) return <></>;

  return (
    <ItemContainer>
      <UserGames user={user} />
    </ItemContainer>
  );
};

export default UserGamesProfile;
