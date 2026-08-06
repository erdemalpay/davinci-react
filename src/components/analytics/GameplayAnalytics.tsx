import { useState } from "react";
import { FaBookReader } from "react-icons/fa";
import { GiAmericanFootballPlayer } from "react-icons/gi";
import { MdFreeBreakfast, MdOutlineSchedule } from "react-icons/md";
import { PiGooglePlayLogo } from "react-icons/pi";
import { RiGameLine } from "react-icons/ri";
import { SiLegacygames, SiWegame } from "react-icons/si";
import { TbPlayCard } from "react-icons/tb";
import UnifiedTabPanel from "../../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { GameplayAnalyticsTabEnum } from "../../types";
import { useGetPanelControlPages } from "../../utils/api/panelControl/page";
import { DateFilter } from "../../utils/dateUtil";
import { Tab } from "../panelComponents/shared/types";
import AllBreaks from "./gameplay/AllBreaks";
import AllGameplayTime from "./gameplay/AllGameplayTime";
import GameplaysByGames from "./gameplay/GameplaysByGame";
import GameplaysByMentor from "./gameplay/GameplaysByMentor";
import KnownGamesCount from "./gameplay/KnownGamesCount";
import LearnedGames from "./gameplay/LearnedGames";
import { MentorAnalyticChart } from "./gameplay/MentorAnalyticChart";
import TablePlayerCount from "./gameplay/TablePlayerCount";

export const GameplayAnalyticsTabs: Tab[] = [
  {
    number: GameplayAnalyticsTabEnum.GAMEPLAYBYGAMEMENTORS,
    label: "Gameplay By Game Mentors",
    content: null,
    isDisabled: false,
  },
  {
    number: GameplayAnalyticsTabEnum.UNIQUEGAMEPLAYBYGAMEMENTORS,
    label: "Unique Gameplay By Game Mentors",
    content: null,
    isDisabled: false,
  },
  {
    number: GameplayAnalyticsTabEnum.TABLEPLAYERCOUNTS,
    label: "Table Player Counts",
    content: null,
    isDisabled: false,
  },
  {
    number: GameplayAnalyticsTabEnum.GAMEPLAYSBYMENTORSDETAILS,
    label: "Gameplays By Mentors Details",
    content: null,
    isDisabled: false,
  },
  {
    number: GameplayAnalyticsTabEnum.GAMEPLAYSBYGAMES,
    label: "Gameplays By Games",
    content: null,
    isDisabled: false,
  },
  {
    number: GameplayAnalyticsTabEnum.KNOWNGAMESCOUNT,
    label: "Known Games Count",
    content: null,
    isDisabled: false,
  },
  {
    number: GameplayAnalyticsTabEnum.LEARNEDGAMES,
    label: "Learned Games",
    content: null,
    isDisabled: false,
  },
  {
    number: GameplayAnalyticsTabEnum.ALLBREAKS,
    label: "All Breaks",
    content: null,
    isDisabled: false,
  },
  {
    number: GameplayAnalyticsTabEnum.ALLGAMEPLAYTIME,
    label: "All Gameplay Time",
    content: null,
    isDisabled: false,
  },
];

export default function GameplayAnalytics() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [dateFilter, setDateFilter] = useState(DateFilter.THIS_MONTH);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string | undefined>("");
  const [location, setLocation] = useState<string>("1,2");
  const [itemLimit, setItemLimit] = useState(5);
  const { setCurrentPage, setSearchQuery } = useGeneralContext();
  const currentPageId = "gameplay_analytics";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || (pages && pages?.length === 0)) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const mentorChartProps = {
    dateFilter,
    setDateFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    location,
    setLocation,
    itemLimit,
    setItemLimit,
  };
  const tabContents: Record<
    number,
    { icon: JSX.Element; content: JSX.Element }
  > = {
    [GameplayAnalyticsTabEnum.GAMEPLAYBYGAMEMENTORS]: {
      icon: <RiGameLine className="text-lg font-thin" />,
      content: <MentorAnalyticChart {...mentorChartProps} />,
    },
    [GameplayAnalyticsTabEnum.UNIQUEGAMEPLAYBYGAMEMENTORS]: {
      icon: <SiWegame className="text-lg font-thin" />,
      content: <MentorAnalyticChart {...mentorChartProps} unique />,
    },
    [GameplayAnalyticsTabEnum.TABLEPLAYERCOUNTS]: {
      icon: <GiAmericanFootballPlayer className="text-lg font-thin" />,
      content: <TablePlayerCount />,
    },
    [GameplayAnalyticsTabEnum.GAMEPLAYSBYMENTORSDETAILS]: {
      icon: <TbPlayCard className="text-lg font-thin" />,
      content: <GameplaysByMentor />,
    },
    [GameplayAnalyticsTabEnum.GAMEPLAYSBYGAMES]: {
      icon: <PiGooglePlayLogo className="text-lg font-thin" />,
      content: <GameplaysByGames />,
    },
    [GameplayAnalyticsTabEnum.KNOWNGAMESCOUNT]: {
      icon: <SiLegacygames className="text-lg font-thin" />,
      content: <KnownGamesCount />,
    },
    [GameplayAnalyticsTabEnum.LEARNEDGAMES]: {
      icon: <FaBookReader className="text-lg font-thin" />,
      content: <LearnedGames />,
    },
    [GameplayAnalyticsTabEnum.ALLBREAKS]: {
      icon: <MdFreeBreakfast className="text-lg font-thin" />,
      content: <AllBreaks />,
    },
    [GameplayAnalyticsTabEnum.ALLGAMEPLAYTIME]: {
      icon: <MdOutlineSchedule className="text-lg font-thin" />,
      content: <AllGameplayTime />,
    },
  };
  const tabs = GameplayAnalyticsTabs.map((tab) => {
    return {
      ...tab,
      icon: tabContents[tab.number].icon,
      content: tabContents[tab.number].content,
      isDisabled: currentPageTabs
        ?.find((item) => item.name === tab.label)
        ?.permissionRoles?.includes(user.role._id)
        ? false
        : true,
    };
  });

  return (
    <>
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
    </>
  );
}
