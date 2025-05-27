import {
  FaPhoenixFramework,
  FaRegListAlt,
  FaRegUserCircle,
} from "react-icons/fa";
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
import GameMasterSummary from "../components/user/GameMasterSummary";
import GamesIKnow from "../components/user/GamesIKnow";
import GamesIMentored from "../components/user/GamesIMentored";
import ServicePersonalSummary from "../components/user/ServicePersonalSummary";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { useGetMentorGamePlays } from "../utils/api/gameplay";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";
import { useGetUser } from "../utils/api/user";

export enum ProfileTabEnum {
  PHOTO,
  PERSONAL_DETAILS,
  CHANGE_PASSWORD,
  SETTINGS,
  MENTORED_GAMES,
  KNOWN_GAMES,
  GAMEMASTERUSERSUMMARY,
  SERVICEPERSONALUSERSUMMARY,
  SHIFTS,
  NOTIFICATIONS,
}
export const ProfilePageTabs = [
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
    content: null, // needs updatedUser prop
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
    content: null, // needs data prop
    isDisabled: true, // default until we check role
  },
  {
    number: ProfileTabEnum.KNOWN_GAMES,
    label: "Known Games",
    icon: <MdOutlineEventNote className="text-lg font-thin" />,
    content: null, // needs user + translate count
    isDisabled: true,
  },
  {
    number: ProfileTabEnum.GAMEMASTERUSERSUMMARY,
    label: "User Summary(Game)",
    icon: <FaRegListAlt className="text-lg font-thin" />,
    content: null, // needs data prop
    isDisabled: true,
  },
  {
    number: ProfileTabEnum.SERVICEPERSONALUSERSUMMARY,
    label: "User Summary(Service)",
    icon: <FaRegListAlt className="text-lg font-thin" />,
    content: null, // needs user + role
    isDisabled: true,
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
    label: "Notifications",
    icon: <IoMdNotifications className="text-lg font-thin" />,
    content: <UserNotifications />,
    isDisabled: false,
  },
];

export default function Profile() {
  const updatedUser = useGetUser();
  const { user } = useUserContext();
  const { data } = useGetMentorGamePlays(user?._id ?? "");
  const {
    setCurrentPage,
    setSearchQuery,
    profileActiveTab,
    setProfileActiveTab,
  } = useGeneralContext();
  const currentPageId = "profile";
  const pages = useGetPanelControlPages();
  if (!user || pages.length === 0) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = ProfilePageTabs.map((tab) => {
    return {
      ...tab,
      isDisabled: currentPageTabs
        ?.find((item) => item.name === tab.label)
        ?.permissionRoles?.includes(user.role._id)
        ? false
        : true,
      ...(tab.number === ProfileTabEnum.PERSONAL_DETAILS && {
        content: updatedUser && (
          <PersonalDetails isEditable={true} user={updatedUser} />
        ),
      }),
      ...(tab.number === ProfileTabEnum.MENTORED_GAMES && {
        content: data && (
          <div className="px-4 w-full ">
            <GamesIMentored data={data} />,
          </div>
        ),
      }),
      ...(tab.number === ProfileTabEnum.KNOWN_GAMES && {
        content: (
          <div className="px-4 w-full ">
            {user && <GamesIKnow userId={user._id} />}
          </div>
        ),
      }),
      ...(tab.number === ProfileTabEnum.GAMEMASTERUSERSUMMARY && {
        content: user && (
          <div className="px-4 w-full">
            <GameMasterSummary userId={user._id} />
          </div>
        ),
      }),
      ...(tab.number === ProfileTabEnum.SERVICEPERSONALUSERSUMMARY && {
        content: user && (
          <div className="px-4 w-full">
            <ServicePersonalSummary userId={user._id} />
          </div>
        ),
      }),
    };
  });

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
