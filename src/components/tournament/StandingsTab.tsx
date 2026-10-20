import { useState } from "react";
import { useTranslation } from "react-i18next";
import { OptionType } from "../../types";
import {
  MatchStage,
  Tournament,
  TournamentFormat,
  TournamentMatch,
  TournamentParticipant,
  TournamentStanding,
} from "../../types/tournament";
import {
  useGetTournamentMatches,
  useGetTournamentParticipants,
  useGetTournamentStandings,
} from "../../utils/api/tournament";
import SelectInput from "../panelComponents/FormElements/SelectInput";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { buildColumns } from "./EliminationBracket";
import { groupRounds } from "./MatchesBoard";
import { useEliminationRoundName } from "./useTournamentForm";

interface Props {
  tournament: Tournament;
}

interface StandingsTableProps {
  tournament: Tournament;
  standings: TournamentStanding[];
  matches: TournamentMatch[];
  participants: Pick<TournamentParticipant, "_id" | "isActive">[];
  // Seçilen puan turunun sonundaki tablo; boşsa güncel tablo
  afterRound?: number;
  setAfterRound: (round?: number) => void;
}

// Eleme oynandıysa sıra = turnuvanın genel sonucu (en ileri gidenler üstte);
// puan turları her tur için bir sütunda o turda alınan puanla gösterilir.
// Panel ve oyuncuların takip sayfası aynı tabloyu kullanır.
export const StandingsTable = ({
  tournament,
  standings,
  matches,
  participants,
  afterRound,
  setAfterRound,
}: StandingsTableProps) => {
  const { t } = useTranslation();
  const roundName = useEliminationRoundName();
  // Tur adları (Yarı Final, Final…) ağaçtaki sütun sayısına göre verilir
  const eliminationRounds = buildColumns(
    tournament,
    matches.filter((m) => m.stage === MatchStage.ELIMINATION),
    participants
  ).length;
  const hasLeague = tournament.format !== TournamentFormat.ELIMINATION;
  // Ulaşılan aşama ancak eleme başlayınca bilgi taşır
  const hasElimination = standings.some((row) => row.elimination);
  const playedRounds = Math.max(
    0,
    ...standings.flatMap((row) => row.rounds?.map((r) => r.round) ?? [])
  );
  const roundNumbers = Array.from({ length: playedRounds }, (_, i) => i + 1);
  // Skoru tamamlanmış puan turları; son puan turu listelenmez, onun sonu güncel tablodan izlenir
  const finishedRounds = groupRounds(matches)
    .filter(
      (group) =>
        group.stage === MatchStage.LEAGUE &&
        group.round < tournament.leagueRounds &&
        group.matches.every((m) => m.isCompleted)
    )
    .map((group) => group.round);
  const roundOptions: OptionType[] = [
    { value: 0, label: t("Current") },
    ...finishedRounds.map((round) => ({
      value: round,
      label: t("End Of Round N", { round }),
    })),
  ];

  // Final ya da 3.'lük masası oynandıysa derece bellidir; değilse elendiği (ya da
  // oynamakta olduğu) tur yazılır. Elemeye kalamayanın yeri Sıra sütunundan belli.
  const result = (row: TournamentStanding) => {
    const { elimination } = row;
    if (!elimination) return <span className="text-gray-300">–</span>;
    const isPlaced =
      (elimination.isFinal || elimination.isThirdPlace) &&
      elimination.tableRank;
    if (isPlaced) return <span className="font-semibold">{row.rank}.</span>;
    // 3.'lük masası final turunda kurulur; skor girilene kadar "Final" yazmasın
    if (elimination.isThirdPlace) return t("Third Place Match");
    return roundName(elimination.round, eliminationRounds);
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
    ...(hasElimination ? [{ key: t("Result"), isSortable: false }] : []),
  ];

  const rowKeys = [
    { key: "rank" },
    { key: "name" },
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
          { key: "avgOpponentPoints" },
        ]
      : []),
    ...(hasElimination ? [{ key: "result", node: result }] : []),
  ];

  // Diğer tablolardaki gibi arama kutusunun yanında; mobilde filtre düğmesinin altında
  const filters = [
    {
      isUpperSide: true,
      isDisabled: finishedRounds.length === 0,
      node: (
        <div className="w-48">
          <SelectInput
            options={roundOptions}
            value={
              roundOptions.find(
                (option) => option.value === (afterRound ?? 0)
              ) ?? null
            }
            onChange={(selected) =>
              setAfterRound((selected as OptionType | null)?.value || undefined)
            }
            isSortDisabled
            isAutoFill={false}
            menuPortalTarget={document.body}
            menuZIndex={9999}
          />
        </div>
      ),
    },
  ];

  return (
    <GenericTable
      rowKeys={rowKeys}
      columns={columns}
      rows={standings}
      isActionsActive={false}
      title={t("Standings")}
      filters={filters}
    />
  );
};

const StandingsTab = ({ tournament }: Props) => {
  const [afterRound, setAfterRound] = useState<number>();
  const standings = useGetTournamentStandings(tournament._id, afterRound);
  const matches = useGetTournamentMatches(tournament._id);
  const participants = useGetTournamentParticipants(tournament._id);
  return (
    <StandingsTable
      tournament={tournament}
      standings={standings}
      matches={matches}
      participants={participants}
      afterRound={afterRound}
      setAfterRound={setAfterRound}
    />
  );
};

export default StandingsTab;
