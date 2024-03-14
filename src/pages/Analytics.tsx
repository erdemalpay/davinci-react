import { useEffect, useState } from "react";
import { BsFillPatchQuestionFill } from "react-icons/bs";
import { PiGooglePlayLogo } from "react-icons/pi";
import { RiGameLine } from "react-icons/ri";
import { SiLegacygames, SiWegame } from "react-icons/si";
import { TbPlayCard } from "react-icons/tb";
import GameplaysByGames from "../components/analytics/GameplaysByGame";
import GameplaysByMentor from "../components/analytics/GameplaysByMentor";
import KnownGamesCount from "../components/analytics/KnownGamesCount";
import { MentorAnalyticChart } from "../components/analytics/MentorAnalyticChart";
import WhoKnows from "../components/analytics/WhoKnows";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { DateFilter } from "../utils/dateUtil";

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [tabPanelKey, setTabPanelKey] = useState<number>(0);
  const [dateFilter, setDateFilter] = useState(DateFilter.SINGLE_DAY);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string | undefined>("");
  const [location, setLocation] = useState<string>("1,2");
  const [itemLimit, setItemLimit] = useState(5);
  const tabs = [
    {
      number: 0,
      label: " Gameplay By Game Mentors",
      icon: <RiGameLine className="text-lg font-thin" />,
      content: (
        <MentorAnalyticChart
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          location={location}
          setLocation={setLocation}
          itemLimit={itemLimit}
          setItemLimit={setItemLimit}
        />
      ),
      isDisabled: false,
    },
    {
      number: 1,
      label: "Unique Gameplay By Game Mentors",
      icon: <SiWegame className="text-lg font-thin" />,
      content: (
        <MentorAnalyticChart
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          location={location}
          setLocation={setLocation}
          itemLimit={itemLimit}
          setItemLimit={setItemLimit}
          unique
        />
      ),
      isDisabled: false,
    },
    {
      number: 2,
      label: "Gameplays By Mentors Details",
      icon: <TbPlayCard className="text-lg font-thin" />,
      content: <GameplaysByMentor />,
      isDisabled: false,
    },
    {
      number: 3,
      label: "Gameplays By Games",
      icon: <PiGooglePlayLogo className="text-lg font-thin" />,
      content: <GameplaysByGames />,
      isDisabled: false,
    },
    {
      number: 4,
      label: "Known Games Count",
      icon: <SiLegacygames className="text-lg font-thin" />,
      content: <KnownGamesCount />,
      isDisabled: false,
    },
    {
      number: 5,
      label: "Who Knows?",
      icon: <BsFillPatchQuestionFill className="text-lg font-thin" />,
      content: <WhoKnows />,
      isDisabled: false,
    },
  ];
  useEffect(() => {
    setTabPanelKey((prev) => prev + 1);
  }, [activeTab]);
  return (
    <>
      <Header showLocationSelector={false} />

      {/* <GameAnalyticChart /> */}
      <TabPanel
        key={tabPanelKey}
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </>
  );
}
