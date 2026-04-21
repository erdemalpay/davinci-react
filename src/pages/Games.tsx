import { useState } from "react";
import { BsFillPatchQuestionFill } from "react-icons/bs";
import { RiGameLine } from "react-icons/ri";
import WhoKnows from "../components/analytics/gameplay/WhoKnows";
import GamesTab from "../components/games/GamesTab";
import { Header } from "../components/header/Header";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../context/General.context";
import { GamesPageTabEnum } from "../types";

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

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-2 mt-5">
        <UnifiedTabPanel
          tabs={GamesPageTabs}
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
