import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaRegUserCircle } from "react-icons/fa";
import { MdOutlineEventNote } from "react-icons/md";
import { TbListDetails } from "react-icons/tb";
import { Header } from "../components/header/Header";
import ChangePassword from "../components/panelComponents/Profile/ChangePassword";
import PersonalDetails from "../components/panelComponents/Profile/PersonalDetails";
import ProfileCard from "../components/panelComponents/Profile/ProfileCard";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import GamesIKnow from "../components/user/GamesIKnow";
import GamesIMentored from "../components/user/GamesIMentored";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { RoleEnum } from "../types";
import { useGetMentorGamePlays } from "../utils/api/gameplay";
import { useGetUser } from "../utils/api/user";

export default function Profile() {
  const updatedUser = useGetUser();
  const { user } = useUserContext();
  const [activeTab, setActiveTab] = useState<number>(0);
  const { t, i18n } = useTranslation();
  const { data } = useGetMentorGamePlays(user?._id ?? "");
  const { setCurrentPage, setSearchQuery } = useGeneralContext();
  const tabs = [
    {
      number: 0,
      label: t("Photo"),
      icon: <FaRegUserCircle className="text-lg font-thin" />,
      content: <ProfileCard />,
      isDisabled: false,
    },
    {
      number: 1,
      label: t("Personal Details"),
      icon: <TbListDetails className="text-lg font-thin" />,
      content: updatedUser && (
        <PersonalDetails isEditable={true} user={updatedUser} />
      ),
      isDisabled: false,
    },
    {
      number: 2,
      label: t("Change Password"),
      icon: <MdOutlineEventNote className="text-lg font-thin" />,
      content: <ChangePassword />,
      isDisabled: false,
    },
    {
      number: 3,
      label: t("Mentored Games"),
      icon: <MdOutlineEventNote className="text-lg font-thin" />,
      content: data && (
        <div className="px-4 w-full ">
          <GamesIMentored data={data} />,
        </div>
      ),
      isDisabled: !(
        user?.role._id === RoleEnum.GAMEMASTER ||
        user?.role._id === RoleEnum.GAMEMANAGER ||
        user?.role._id === RoleEnum.MANAGER
      ),
    },
    {
      number: 4,
      label: `${t("Known Games")} (${user?.userGames.length})`,
      icon: <MdOutlineEventNote className="text-lg font-thin" />,
      content: (
        <div className="px-4 w-full ">
          {user && <GamesIKnow userId={user._id} />}
        </div>
      ),
      isDisabled: !(
        user?.role._id === RoleEnum.GAMEMASTER ||
        user?.role._id === RoleEnum.GAMEMANAGER ||
        user?.role._id === RoleEnum.MANAGER
      ),
    },
  ];

  return (
    <>
      <Header showLocationSelector={false} />
      <TabPanel
        key={i18n.language}
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        additionalOpenAction={() => {
          setCurrentPage(1);
          setSearchQuery("");
        }}
      />
    </>
  );
}
