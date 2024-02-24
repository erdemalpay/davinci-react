import { FaRegUserCircle } from "react-icons/fa";
import { MdOutlineEventNote } from "react-icons/md";
import { TbListDetails } from "react-icons/tb";
import { Header } from "../components/header/Header";
import ChangePassword from "../components/panelComponents/Profile/ChangePassword";
import PersonalDetails from "../components/panelComponents/Profile/PersonalDetails";
import ProfileCard from "../components/panelComponents/Profile/ProfileCard";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";

export default function Profile() {
  const tabs = [
    {
      number: 0,
      label: " Photo",
      icon: <FaRegUserCircle className="text-lg font-thin" />,
      content: <ProfileCard />,
    },
    {
      number: 1,
      label: "Personal Details",
      icon: <TbListDetails className="text-lg font-thin" />,
      content: <PersonalDetails />,
    },
    {
      number: 2,
      label: "Change Password",
      icon: <MdOutlineEventNote className="text-lg font-thin" />,
      content: <ChangePassword />,
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
