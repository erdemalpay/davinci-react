import { useState } from "react";
import { MdOutlineEventNote } from "react-icons/md";
import { useParams } from "react-router-dom";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import ItemContainer from "../components/panelComponents/common/ItemContainer";
import GamesIKnow from "../components/tables/GamesIKnow";
import GamesIMentored from "../components/tables/GamesIMentored";
import { RoleEnum } from "../types";
import { useGetMentorGamePlays } from "../utils/api/gameplay";
import { useGetUserWithId } from "../utils/api/user";

export default function UserView() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const { userId } = useParams();
  const user = useGetUserWithId(userId as string);

  const { data } = useGetMentorGamePlays(userId as string);

  const tabs = [
    {
      number: 0,
      label: "Mentored Games",
      icon: <MdOutlineEventNote className="text-lg font-thin" />,
      content: user && data && (
        <ItemContainer>
          <GamesIMentored data={data} />
        </ItemContainer>
      ),
      isDisabled: !(
        user?.role._id === RoleEnum.GAMEMASTER ||
        user?.role._id === RoleEnum.GAMEMANAGER ||
        user?.role._id === RoleEnum.MANAGER
      ),
    },
    {
      number: 1,
      label: "Known Games",
      icon: <MdOutlineEventNote className="text-lg font-thin" />,
      content: user && (
        <ItemContainer>
          <GamesIKnow userId={user._id} />
        </ItemContainer>
      ),
      isDisabled: !(
        user?.role._id === RoleEnum.GAMEMASTER ||
        user?.role._id === RoleEnum.GAMEMANAGER ||
        user?.role._id === RoleEnum.MANAGER
      ),
    },
  ];
  if (!user) return <></>;
  return (
    <>
      <Header showLocationSelector={false} />
      {user && (
        <TabPanel
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}
    </>
  );
}
