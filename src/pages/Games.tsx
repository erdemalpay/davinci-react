import { useState } from "react";
import { BsFillPatchQuestionFill } from "react-icons/bs";
import { RiGameLine } from "react-icons/ri";
import WhoKnows from "../components/analytics/gameplay/WhoKnows";
import GamesTab from "../components/games/GamesTab";
import { Header } from "../components/header/Header";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { GamesPageTabEnum } from "../types";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

export const GamesPageTabs = [
  {
    number: GamesPageTabEnum.GAMES,
    label: "Games",
    icon: <RiGameLine className="text-lg font-thin" />,
    content: <GamesTab />,
    isDisabled: false,
  },
  {
    number: GamesPageTabEnum.WHOKNOWS,
    label: "Who Knows?",
    icon: <BsFillPatchQuestionFill className="text-lg font-thin" />,
    content: <WhoKnows />,
    isDisabled: false,
  },
];

export default function Games() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const { setCurrentPage, setSearchQuery } = useGeneralContext();
  const currentPageId = "games";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || pages.length === 0) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = GamesPageTabs.map((tab) => {
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
      <div className="flex flex-col gap-2 mt-5">
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
