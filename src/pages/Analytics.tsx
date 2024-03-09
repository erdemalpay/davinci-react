import { useEffect, useState } from "react";
import { RiGameLine } from "react-icons/ri";
import { SiWegame } from "react-icons/si";
import { MentorAnalyticChart } from "../components/analytics/MentorAnalyticChart";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [tabPanelKey, setTabPanelKey] = useState<number>(0);

  const tabs = [
    {
      number: 0,
      label: " Gameplay By Game Mentors",
      icon: <RiGameLine className="text-lg font-thin" />,
      content: <MentorAnalyticChart />,
      isDisabled: false,
    },
    {
      number: 1,
      label: "Unique Gameplay By Game Mentors",
      icon: <SiWegame className="text-lg font-thin" />,
      content: <MentorAnalyticChart unique />,
      isDisabled: false,
    },
  ];
  useEffect(() => {
    setTabPanelKey((prev) => prev + 1);
  }, [activeTab]);
  return (
    <>
      <Header showLocationSelector={false} />

      <div className="flex flex-col lg:flex-row justify-between w-full gap-4 py-2 h-[500px] px-2 lg:px-2">
        {/* <GameAnalyticChart /> */}
        <TabPanel
          key={tabPanelKey}
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </>
  );
}
