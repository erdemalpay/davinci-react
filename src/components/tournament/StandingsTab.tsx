import { useTranslation } from "react-i18next";
import {
  Tournament,
  TournamentFormat,
  TournamentStanding,
} from "../../types/tournament";
import { useGetTournamentStandings } from "../../utils/api/tournament";
import GenericTable from "../panelComponents/Tables/GenericTable";

interface Props {
  tournament: Tournament;
}

// Eleme oynandıysa sıra = turnuvanın genel sonucu (en ileri gidenler üstte);
// Swiss puanları sadece Swiss aşaması olan formatlarda gösterilir.
const StandingsTab = ({ tournament }: Props) => {
  const { t } = useTranslation();
  const standings = useGetTournamentStandings(tournament._id);
  const hasLeague = tournament.format !== TournamentFormat.ELIMINATION;
  const hasElimination = tournament.format !== TournamentFormat.LEAGUE;

  const stageReached = (row: TournamentStanding) => {
    const { elimination } = row;
    if (!elimination) return t("Point Rounds");
    const stage = elimination.isFinal
      ? t("Final")
      : t("Elimination Round N", { round: elimination.round });
    return elimination.tableRank
      ? `${stage} – ${elimination.tableRank}.`
      : stage;
  };

  const columns = [
    { key: t("Rank"), isSortable: true },
    { key: t("Name"), isSortable: true },
    ...(hasElimination ? [{ key: t("Stage Reached"), isSortable: false }] : []),
    ...(hasLeague
      ? [
          { key: t("Points"), isSortable: true },
          { key: t("Matches Played"), isSortable: true },
          { key: t("Bye"), isSortable: true },
          { key: t("Avg. Opponent Points"), isSortable: true },
        ]
      : []),
  ];

  const rowKeys = [
    { key: "rank" },
    { key: "name" },
    ...(hasElimination ? [{ key: "stageReached", node: stageReached }] : []),
    ...(hasLeague
      ? [
          { key: "points" },
          { key: "matchesPlayed" },
          { key: "byeCount" },
          { key: "avgOpponentPoints" },
        ]
      : []),
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
