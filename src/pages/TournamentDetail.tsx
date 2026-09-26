import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MdLeaderboard, MdPeople, MdTableRestaurant } from "react-icons/md";
import { RiFileList3Line } from "react-icons/ri";
import { useParams } from "react-router-dom";
import { Header } from "../components/header/Header";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import MatchesTab from "../components/tournament/MatchesTab";
import ParticipantsTab from "../components/tournament/ParticipantsTab";
import RegistrationsTab from "../components/tournament/RegistrationsTab";
import StandingsTab from "../components/tournament/StandingsTab";
import { Routes } from "../navigation/constants";
import { useGetTournaments } from "../utils/api/tournament";

const TournamentDetail = () => {
  const { t } = useTranslation();
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const tournaments = useGetTournaments();
  const tournament = tournaments.find(
    (item) => String(item._id) === tournamentId
  );
  const [activeTab, setActiveTab] = useState<number>(0);

  const pageNavigations = [
    { name: t("Tournaments"), path: Routes.Tournaments, canBeClicked: true },
    { name: tournament?.name ?? "", path: "", canBeClicked: false },
  ];

  if (!tournament) {
    // Liste henüz yüklenmediyse "bulunamadı" göstermeyelim
    if (tournaments.length === 0)
      return <Header showLocationSelector={false} />;
    return (
      <>
        <Header showLocationSelector={false} />
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
          {t("Tournament not found")}
        </div>
      </>
    );
  }

  const tabs = [
    {
      number: 0,
      label: "Registrations",
      icon: <RiFileList3Line className="text-lg font-thin" />,
      content: <RegistrationsTab tournament={tournament} />,
      isDisabled: false,
    },
    {
      number: 1,
      label: "Participants",
      icon: <MdPeople className="text-lg font-thin" />,
      content: <ParticipantsTab tournament={tournament} />,
      isDisabled: false,
    },
    {
      number: 2,
      label: "Matches",
      icon: <MdTableRestaurant className="text-lg font-thin" />,
      content: <MatchesTab tournament={tournament} />,
      isDisabled: false,
    },
    {
      number: 3,
      label: "Standings",
      icon: <MdLeaderboard className="text-lg font-thin" />,
      content: <StandingsTab tournament={tournament} />,
      isDisabled: false,
    },
  ];

  return (
    <>
      <Header showLocationSelector={false} />
      <PageNavigator navigations={pageNavigations} />
      <div className="flex flex-col gap-2 mt-5">
        <UnifiedTabPanel
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </>
  );
};

export default TournamentDetail;
