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
// puan turları her tur için bir sütunda o turda alınan puanla gösterilir.
const StandingsTab = ({ tournament }: Props) => {
  const { t } = useTranslation();
  const standings = useGetTournamentStandings(tournament._id);
  const hasLeague = tournament.format !== TournamentFormat.ELIMINATION;
  // Ulaşılan aşama ancak eleme başlayınca bilgi taşır
  const hasElimination = standings.some((row) => row.elimination);
  const playedRounds = Math.max(
    0,
    ...standings.flatMap((row) => row.rounds?.map((r) => r.round) ?? [])
  );
  const roundNumbers = Array.from({ length: playedRounds }, (_, i) => i + 1);

  const stageReached = (row: TournamentStanding) => {
    const { elimination } = row;
    if (!elimination) return t("Point Rounds");
    const stage = elimination.isFinal
      ? t("Final")
      : elimination.isThirdPlace
      ? t("Third Place Match")
      : t("Elimination Round N", { round: elimination.round });
    return elimination.tableRank
      ? `${stage} – ${elimination.tableRank}.`
      : stage;
  };

  const roundCell = (row: TournamentStanding, round: number) => {
    const result = row.rounds?.find((r) => r.round === round);
    if (!result)
      return (
        <span className="text-gray-300" title={t("No scored match this round")}>
          –
        </span>
      );
    return (
      <span className="whitespace-nowrap">
        {result.isBye && (
          <span className="mr-1 text-[10px] rounded bg-gray-100 text-gray-600 px-1">
            {t("Bye")}
          </span>
        )}
        <span className="font-medium">+{result.points}</span>
      </span>
    );
  };

  const columns = [
    { key: t("Rank"), isSortable: true },
    { key: t("Name"), isSortable: true },
    ...(hasElimination ? [{ key: t("Stage Reached"), isSortable: false }] : []),
    ...(hasLeague
      ? [
          ...roundNumbers.map((round) => ({
            key: t("Round Short N", { round }),
            isSortable: false,
          })),
          { key: t("Total"), isSortable: true },
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
          ...roundNumbers.map((round) => ({
            key: `round_${round}`,
            node: (row: TournamentStanding) => roundCell(row, round),
          })),
          {
            key: "points",
            node: (row: TournamentStanding) => (
              <span className="font-semibold">{row.points}</span>
            ),
          },
          {
            key: "avgOpponentPoints",
            node: (row: TournamentStanding) =>
              Number(row.avgOpponentPoints.toFixed(2)),
          },
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
