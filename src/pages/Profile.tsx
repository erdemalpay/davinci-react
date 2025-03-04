import { useTranslation } from "react-i18next";
import { FaPhoenixFramework, FaRegUserCircle } from "react-icons/fa";
import { IoIosSettings, IoMdNotifications } from "react-icons/io";
import { MdOutlineEventNote } from "react-icons/md";
import { TbListDetails } from "react-icons/tb";
import { Header } from "../components/header/Header";
import ChangePassword from "../components/panelComponents/Profile/ChangePassword";
import PersonalDetails from "../components/panelComponents/Profile/PersonalDetails";
import ProfileCard from "../components/panelComponents/Profile/ProfileCard";
import Settings from "../components/panelComponents/Profile/Settings";
import UserNotifications from "../components/panelComponents/Profile/UserNotifications";
import UserShifts from "../components/panelComponents/Profile/UserShifts";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import GamesIKnow from "../components/user/GamesIKnow";
import GamesIMentored from "../components/user/GamesIMentored";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { RoleEnum } from "../types";
import { useGetMentorGamePlays } from "../utils/api/gameplay";
import { useGetUser } from "../utils/api/user";

export enum ProfileTabEnum {
  PHOTO,
  PERSONAL_DETAILS,
  CHANGE_PASSWORD,
  SETTINGS,
  MENTORED_GAMES,
  KNOWN_GAMES,
  SHIFTS,
  NOTIFICATIONS,
}
export default function Profile() {
  const updatedUser = useGetUser();
  const { user } = useUserContext();
  const { t } = useTranslation();
  const { data } = useGetMentorGamePlays(user?._id ?? "");
  const {
    setCurrentPage,
    setSearchQuery,
    profileActiveTab,
    setProfileActiveTab,
  } = useGeneralContext();
  const tabs = [
    {
      number: ProfileTabEnum.PHOTO,
      label: "Photo",
      icon: <FaRegUserCircle className="text-lg font-thin" />,
      content: <ProfileCard />,
      isDisabled: false,
    },
    {
      number: ProfileTabEnum.PERSONAL_DETAILS,
      label: "Personal Details",
      icon: <TbListDetails className="text-lg font-thin" />,
      content: updatedUser && (
        <PersonalDetails isEditable={true} user={updatedUser} />
      ),
      isDisabled: false,
    },
    {
      number: ProfileTabEnum.CHANGE_PASSWORD,
      label: "Change Password",
      icon: <MdOutlineEventNote className="text-lg font-thin" />,
      content: <ChangePassword />,
      isDisabled: false,
    },
    {
      number: ProfileTabEnum.SETTINGS,
      label: "Settings",
      icon: <IoIosSettings className="text-lg font-thin" />,
      content: <Settings />,
      isDisabled: false,
    },
    {
      number: ProfileTabEnum.MENTORED_GAMES,
      label: "Mentored Games",
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
      number: ProfileTabEnum.KNOWN_GAMES,
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
    {
      number: ProfileTabEnum.SHIFTS,
      label: "Shifts",
      icon: <FaPhoenixFramework className="text-lg font-thin" />,
      content: <UserShifts />,
      isDisabled: false,
    },
    {
      number: ProfileTabEnum.NOTIFICATIONS,
      label: t("Notifications"),
      icon: <IoMdNotifications className="text-lg font-thin" />,
      content: <UserNotifications />,
      isDisabled: false,
    },
  ];

  return (
    <>
      <Header showLocationSelector={true} />
      <TabPanel
        tabs={tabs}
        activeTab={profileActiveTab}
        setActiveTab={setProfileActiveTab}
        additionalOpenAction={() => {
          setCurrentPage(1);
          setSearchQuery("");
        }}
      />
    </>
  );
}
