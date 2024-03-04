import { useState } from "react";
import { FaRegUserCircle } from "react-icons/fa";
import { MdOutlineEventNote } from "react-icons/md";
import { TbListDetails } from "react-icons/tb";
import { Header } from "../components/header/Header";
import ChangePassword from "../components/panelComponents/Profile/ChangePassword";
import PersonalDetails from "../components/panelComponents/Profile/PersonalDetails";
import ProfileCard from "../components/panelComponents/Profile/ProfileCard";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import ItemContainer from "../components/panelComponents/common/ItemContainer";
import GamesIKnow from "../components/tables/GamesIKnow";
import GamesIMentored from "../components/tables/GamesIMentored";
import { RoleEnum } from "../types";
import { useGetMentorGamePlays } from "../utils/api/gameplay";
import { useGetUser } from "../utils/api/user";

export default function Profile() {
  const user = useGetUser();
  if (!user) return <></>;
  const [activeTab, setActiveTab] = useState<number>(0);

  const { data } = useGetMentorGamePlays(user._id);

  const tabs = [
    {
      number: 0,
      label: " Photo",
      icon: <FaRegUserCircle className="text-lg font-thin" />,
      content: <ProfileCard />,
      isDisabled: false,
    },
    {
      number: 1,
      label: "Personal Details",
      icon: <TbListDetails className="text-lg font-thin" />,
      content: <PersonalDetails />,
      isDisabled: false,
    },
    {
      number: 2,
      label: "Change Password",
      icon: <MdOutlineEventNote className="text-lg font-thin" />,
      content: <ChangePassword />,
      isDisabled: false,
    },
    {
      number: 3,
      label: "Mentored Games",
      icon: <MdOutlineEventNote className="text-lg font-thin" />,
      content: (
        <ItemContainer>
          <GamesIMentored data={data ?? []} />
        </ItemContainer>
      ),
      isDisabled: !(
        user.role._id === RoleEnum.GAMEMASTER ||
        user.role._id === RoleEnum.GAMEMANAGER ||
        user.role._id === RoleEnum.MANAGER
      ),
    },
    {
      number: 4,
      label: "Known Games",
      icon: <MdOutlineEventNote className="text-lg font-thin" />,
      content: (
        <ItemContainer>
          <GamesIKnow userId={user._id} />
        </ItemContainer>
      ),
      isDisabled: !(
        user.role._id === RoleEnum.GAMEMASTER ||
        user.role._id === RoleEnum.GAMEMANAGER ||
        user.role._id === RoleEnum.MANAGER
      ),
    },
  ];

  return (
    <>
      <Header showLocationSelector={false} />
      {/* <BreadCrumb title="Profile" /> */}
      <TabPanel tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  );
}
