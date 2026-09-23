import { useTranslation } from "react-i18next";
import { Tournament } from "../../types/tournament";
import { useGetTournamentStandings } from "../../utils/api/tournament";
import GenericTable from "../panelComponents/Tables/GenericTable";

interface Props {
  tournament: Tournament;
}

const StandingsTab = ({ tournament }: Props) => {
  const { t } = useTranslation();
  const standings = useGetTournamentStandings(tournament._id);

  const columns = [
    { key: t("Rank"), isSortable: true },
    { key: t("Name"), isSortable: true },
    { key: t("Points"), isSortable: true },
    { key: t("Matches Played"), isSortable: true },
    { key: t("Bye"), isSortable: true },
    { key: t("Avg. Opponent Points"), isSortable: true },
  ];

  const rowKeys = [
    { key: "rank" },
    { key: "name" },
    { key: "points" },
    { key: "matchesPlayed" },
    { key: "byeCount" },
    { key: "avgOpponentPoints" },
  ];

  return (
    <GenericTable
      rowKeys={rowKeys}
      columns={columns}
      rows={standings}
      isActionsActive={false}
      title={t("Standings")}
    />
  );
};

export default StandingsTab;
