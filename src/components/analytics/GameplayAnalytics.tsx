import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BsFillPatchQuestionFill } from "react-icons/bs";
import { FaBookReader } from "react-icons/fa";
import { GiAmericanFootballPlayer } from "react-icons/gi";
import { PiGooglePlayLogo } from "react-icons/pi";
import { RiGameLine } from "react-icons/ri";
import { SiLegacygames, SiWegame } from "react-icons/si";
import { TbPlayCard } from "react-icons/tb";
import UnifiedTabPanel from "../../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../../context/General.context";
import { GameplayAnalyticsTabEnum } from "../../types";
import { DateFilter } from "../../utils/dateUtil";
import GameplaysByGames from "./gameplay/GameplaysByGame";
import GameplaysByMentor from "./gameplay/GameplaysByMentor";
import KnownGamesCount from "./gameplay/KnownGamesCount";
import LearnedGames from "./gameplay/LearnedGames";
import { MentorAnalyticChart } from "./gameplay/MentorAnalyticChart";
import TablePlayerCount from "./gameplay/TablePlayerCount";
import WhoKnows from "./gameplay/WhoKnows";

export default function GameplayAnalytics() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [dateFilter, setDateFilter] = useState(DateFilter.SINGLE_DAY);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string | undefined>("");
  const [location, setLocation] = useState<string>("1,2");
  const [itemLimit, setItemLimit] = useState(5);
  const { setCurrentPage, setSearchQuery } = useGeneralContext();
  const tabs = [
    {
      number: GameplayAnalyticsTabEnum.GAMEPLAYBYGAMEMENTORS,
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
      number: GameplayAnalyticsTabEnum.UNIQUEGAMEPLAYBYGAMEMENTORS,
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
      number: GameplayAnalyticsTabEnum.TABLEPLAYERCOUNTS,
      label: "Table Player Counts",
      icon: <GiAmericanFootballPlayer className="text-lg font-thin" />,
      content: <TablePlayerCount />,
      isDisabled: false,
    },
    {
      number: GameplayAnalyticsTabEnum.GAMEPLAYSBYMENTORSDETAILS,
      label: "Gameplays By Mentors Details",
      icon: <TbPlayCard className="text-lg font-thin" />,
      content: <GameplaysByMentor />,
      isDisabled: false,
    },
    {
      number: GameplayAnalyticsTabEnum.GAMEPLAYSBYGAMES,
      label: "Gameplays By Games",
      icon: <PiGooglePlayLogo className="text-lg font-thin" />,
      content: <GameplaysByGames />,
      isDisabled: false,
    },
    {
      number: GameplayAnalyticsTabEnum.KNOWNGAMESCOUNT,
      label: "Known Games Count",
      icon: <SiLegacygames className="text-lg font-thin" />,
      content: <KnownGamesCount />,
      isDisabled: false,
    },
    {
      number: GameplayAnalyticsTabEnum.WHOKNOWS,
      label: "Who Knows?",
      icon: <BsFillPatchQuestionFill className="text-lg font-thin" />,
      content: <WhoKnows />,
      isDisabled: false,
    },
    {
      number: GameplayAnalyticsTabEnum.LEARNEDGAMES,
      label: "Learned Games",
      icon: <FaBookReader className="text-lg font-thin" />,
      content: <LearnedGames />,
      isDisabled: false,
    },
  ];

  return (
    <>
      <UnifiedTabPanel
        tabs={tabs?.map((tab) => ({
          ...tab,
          number: tab.number - tabs?.filter((t) => t?.isDisabled)?.length,
        }))}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        additionalOpenAction={() => {
          setCurrentPage(1);
          setSearchQuery("");
        }}
        allowOrientationToggle={true}
      />
    </>
  );
}
