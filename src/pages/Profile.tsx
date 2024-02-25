import { FaRegUserCircle } from "react-icons/fa";
import { MdOutlineEventNote } from "react-icons/md";
import { TbListDetails } from "react-icons/tb";
import { Header } from "../components/header/Header";
import ChangePassword from "../components/panelComponents/Profile/ChangePassword";
import GameMasterProfile from "../components/panelComponents/Profile/GameMaster/GameMasterProfile";
import PersonalDetails from "../components/panelComponents/Profile/PersonalDetails";
import ProfileCard from "../components/panelComponents/Profile/ProfileCard";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useUserContext } from "../context/User.context";

export default function Profile() {
  const { user } = useUserContext();
  if (!user) return <></>;

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
      label: "Game Master",
      icon: <MdOutlineEventNote className="text-lg font-thin" />,
      content: <GameMasterProfile />,
      isDisabled: user.role._id !== 2,
    },
  ];

  return (
    <>
      <Header showLocationSelector={false} />
      {/* <BreadCrumb title="Profile" /> */}
      <TabPanel tabs={tabs} />
    </>
  );
}
