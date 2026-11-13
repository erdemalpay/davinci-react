import { useTranslation } from "react-i18next";
import {
  MatchStage,
  Tournament,
  TournamentMatch,
  TournamentParticipant,
  TournamentStatus,
} from "../../types/tournament";
import EliminationBracket from "./EliminationBracket";
import MatchCard from "./MatchCard";
import { SeatEditing } from "./useSeatEditing";

type RoundGroup = {
  key: string;
  stage: MatchStage;
  round: number;
  matches: TournamentMatch[];
};

const STAGE_ORDER = [MatchStage.LEAGUE, MatchStage.ELIMINATION];

export const groupRounds = (matches: TournamentMatch[]): RoundGroup[] => {
  const groups = new Map<string, RoundGroup>();
  for (const match of matches) {
    const key = `${match.stage}-${match.round}`;
    const group = groups.get(key) ?? {
      key,
      stage: match.stage,
      round: match.round,
      matches: [],
    };
    group.matches.push(match);
    groups.set(key, group);
  }
  // Bay kartları masaların sonunda
  groups.forEach((group) =>
    group.matches.sort((a, b) => Number(a.isBye) - Number(b.isBye))
  );
  return Array.from(groups.values()).sort(
    (a, b) =>
      STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) ||
      a.round - b.round
  );
};

interface Props {
  tournament: Tournament;
  matches: TournamentMatch[];
  participants: Pick<
    TournamentParticipant,
    "_id" | "name" | "isActive" | "drawNumber"
  >[];
  names: Map<number, string>;
  // Verilmezse sadece görüntülenir (oyuncuların takip sayfası)
  seatEditing?: SeatEditing;
  highlightIds?: Set<number>;
}

// Eleme ağacı ve puan turlarının masaları; panelde son tur düzenlenebilir
const MatchesBoard = ({
  tournament,
  matches,
  participants,
  names,
  seatEditing,
  highlightIds,
}: Props) => {
  const { t } = useTranslation();
  // Puan turlarında skoru girilmemiş kartlar oyuncuların o anki toplamına göre dizilir
  const totals = new Map<number, number>();
  matches
    .filter((m) => m.stage === MatchStage.LEAGUE && m.isCompleted)
    .forEach((m) =>
      m.players.forEach((p) =>
        totals.set(
          p.participantId,
          (totals.get(p.participantId) ?? 0) + (p.points ?? 0)
        )
      )
    );
  // Catan eşleşme planında oyuncunun çekiliş numarası adının yanında yazılır
  const drawNumbers = new Map<number, number>();
  participants.forEach(
    (p) => p.drawNumber && drawNumbers.set(p._id, p.drawNumber)
  );
  const rounds = groupRounds(matches);
  const latest = rounds[rounds.length - 1];
  const canEdit =
    !!seatEditing && tournament.status !== TournamentStatus.FINISHED;

  return (
    <>
      {matches.some((m) => m.stage === MatchStage.ELIMINATION) && (
        <section className="flex flex-col gap-3">
          <h3 className="font-semibold text-lg">{t("Elimination Bracket")}</h3>
          <EliminationBracket
            tournament={tournament}
            matches={matches}
            participants={participants}
            names={names}
            editableRound={
              canEdit && latest?.stage === MatchStage.ELIMINATION
                ? latest.round
                : undefined
            }
            seatEditing={seatEditing}
            highlightIds={highlightIds}
          />
        </section>
      )}

      {/* Eleme turlarının skorları ağaçtan girildiği için burada sadece puan turları; en yenisi üstte */}
      {[...rounds]
        .filter((group) => group.stage === MatchStage.LEAGUE)
        .reverse()
        .map((group) => (
          <section key={group.key} className="flex flex-col gap-3">
            <h3 className="font-semibold text-lg">
              {t("League Round N", { round: group.round })}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.matches.map((match) => (
                <MatchCard
                  key={match._id}
                  match={match}
                  names={names}
                  drawNumbers={drawNumbers}
                  totals={totals}
                  isEditable={canEdit && group.key === latest?.key}
                  seatEditing={seatEditing}
                  highlightIds={highlightIds}
                />
              ))}
            </div>
          </section>
        ))}
    </>
  );
};

export default MatchesBoard;
