import { useState } from "react";
import { MdOutlineCompare, MdOutlineMail } from "react-icons/md";
import { Header } from "../components/header/Header";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { MailPageTabEnum } from "../types";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";
import BackInStock from "./BackInStock";
import MailDrafts from "./MailDrafts";
import MailLogs from "./MailLogs";
import MailSubscriptions from "./MailSubscriptions";
import MailTemplates from "./MailTemplates";

export const MailPageTabs = [
  {
    number: MailPageTabEnum.MAILTEMPLATES,
    label: "Mail Templates",
    icon: <MdOutlineMail className="text-lg font-thin" />,
    content: <MailTemplates />,
    isDisabled: false,
  },
  {
    number: MailPageTabEnum.MAILDRAFTS,
    label: "Mail Drafts",
    icon: <MdOutlineMail className="text-lg font-thin" />,
    content: <MailDrafts />,
    isDisabled: false,
  },
  {
    number: MailPageTabEnum.BACKINSTOCK,
    label: "Back In Stock",
    icon: <MdOutlineCompare className="text-lg font-thin" />,
    content: <BackInStock />,
    isDisabled: false,
  },
  {
    number: MailPageTabEnum.MAILSUBSCRIPTIONS,
    label: "Mail Subscriptions",
    icon: <MdOutlineMail className="text-lg font-thin" />,
    content: <MailSubscriptions />,
    isDisabled: false,
  },
  {
    number: MailPageTabEnum.MAILLOGS,
    label: "Mail Logs",
    icon: <MdOutlineMail className="text-lg font-thin" />,
    content: <MailLogs />,
    isDisabled: false,
  },
];

export default function Mail() {
  const { setCurrentPage, setSearchQuery } = useGeneralContext();
  const [activeTab, setActiveTab] = useState(MailPageTabs[0].number);
  const currentPageId = "mail";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || pages.length === 0) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = MailPageTabs.map((tab) => {
    const foundTab = currentPageTabs?.find((item) => item.name === tab.label);
    return {
      ...tab,
      isDisabled: foundTab
        ? !foundTab.permissionRoles?.includes(user.role._id)
        : false,
    };
  });

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-2 mt-5 ">
        <UnifiedTabPanel
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          additionalOpenAction={() => {
            setCurrentPage(1);
            setSearchQuery("");
          }}
          allowOrientationToggle={true}
        />
      </div>
    </>
  );
}
