import { useState } from "react";
import { IoNotificationsCircle } from "react-icons/io5";
import { MdAssignmentAdd, MdOutlineNotificationAdd } from "react-icons/md";
import { Header } from "../components/header/Header";
import AllNotifications from "../components/notification/AllNotifications";
import AssignNotification from "../components/notification/AssignNotification";
import CreateNotification from "../components/notification/CreateNotification";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { NotificationPageTabEnum } from "../types";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

export const NotificationPageTabs = [
  {
    number: NotificationPageTabEnum.CREATENOTIFICATION,
    label: "Create Notification",
    icon: <MdOutlineNotificationAdd className="text-lg font-thin" />,
    content: <CreateNotification />,
    isDisabled: false,
  },
  {
    number: NotificationPageTabEnum.ALLNOTIFICATIONS,
    label: "All Notifications",
    icon: <IoNotificationsCircle className="text-lg font-thin" />,
    content: <AllNotifications />,
    isDisabled: false,
  },
  {
    number: NotificationPageTabEnum.ASSIGNEDNOTIFICATIONS,
    label: "Assigned Notifications",
    icon: <MdAssignmentAdd className="text-lg font-thin" />,
    content: <AssignNotification />,
    isDisabled: false,
  },
];
export default function Notifications() {
  const { setCurrentPage, setSearchQuery } = useGeneralContext();
  const [activeTab, setActiveTab] = useState(
    NotificationPageTabEnum.CREATENOTIFICATION
  );
  const currentPageId = "notifications";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || pages.length === 0) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = NotificationPageTabs.map((tab) => {
    return {
      ...tab,
      isDisabled: currentPageTabs
        ?.find((item) => item.name === tab.label)
        ?.permissionRoles?.includes(user.role._id)
        ? false
        : true,
    };
  });
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-2 mt-5 ">
        <TabPanel
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          additionalOpenAction={() => {
            setCurrentPage(1);
            setSearchQuery("");
          }}
        />
      </div>
    </>
  );
}
