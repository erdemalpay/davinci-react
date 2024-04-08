import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BsFillPatchQuestionFill } from "react-icons/bs";
import { PiGooglePlayLogo } from "react-icons/pi";
import { RiGameLine } from "react-icons/ri";
import { SiLegacygames, SiWegame } from "react-icons/si";
import { TbPlayCard } from "react-icons/tb";
import { DateFilter } from "../../utils/dateUtil";
import { Header } from "../header/Header";
import TabPanel from "../panelComponents/TabPanel/TabPanel";
import GameplaysByGames from "./gameplay/GameplaysByGame";
import GameplaysByMentor from "./gameplay/GameplaysByMentor";
import KnownGamesCount from "./gameplay/KnownGamesCount";
import { MentorAnalyticChart } from "./gameplay/MentorAnalyticChart";
import WhoKnows from "./gameplay/WhoKnows";

export default function GameplayAnalytics() {
  const { t } = useTranslation();
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
      label: "Gameplay By Game Mentors",
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
      label: t("Unique Gameplay By Game Mentors"),
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
      label: t("Gameplays By Mentors Details"),
      icon: <TbPlayCard className="text-lg font-thin" />,
      content: <GameplaysByMentor />,
      isDisabled: false,
    },
    {
      number: 3,
      label: t("Gameplays By Games"),
      icon: <PiGooglePlayLogo className="text-lg font-thin" />,
      content: <GameplaysByGames />,
      isDisabled: false,
    },
    {
      number: 4,
      label: t("Known Games Count"),
      icon: <SiLegacygames className="text-lg font-thin" />,
      content: <KnownGamesCount />,
      isDisabled: false,
    },
    {
      number: 5,
      label: t("Who Knows?"),
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

      <TabPanel
        key={tabPanelKey}
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </>
  );
}
