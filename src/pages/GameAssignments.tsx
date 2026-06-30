import { useState } from "react";
import { RiGameLine } from "react-icons/ri";
import AssignGame from "../components/games/AssignGame";
import GameAssignments from "../components/games/GameAssignments";
import { Header } from "../components/header/Header";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { GamesPageTabEnum } from "../types";

export const GameAssignmentsPageTabs = [
  {
    number: GamesPageTabEnum.ASSIGNGAME,
    label: "Assign Game",
    icon: <RiGameLine className="text-lg font-thin" />,
    content: <AssignGame />,
    isDisabled: false,
  },
  {
    number: GamesPageTabEnum.ASSIGNMENTS,
    label: "Game Assignments",
    icon: <RiGameLine className="text-lg font-thin" />,
    content: <GameAssignments />,
    isDisabled: false,
  },
];

export default function GameAssignmentsPage() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const { setCurrentPage, setSearchQuery } = useGeneralContext();
  const { user } = useUserContext();

  if (!user) return <></>;

  const tabs = GameAssignmentsPageTabs.map((tab) => ({
    ...tab,
  }));

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
