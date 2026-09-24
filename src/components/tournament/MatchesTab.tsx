import { useTranslation } from "react-i18next";
import {
  MatchStage,
  Tournament,
  TournamentMatch,
  TournamentStatus,
} from "../../types/tournament";
import {
  useGetTournamentMatches,
  useGetTournamentParticipants,
  useTournamentActions,
} from "../../utils/api/tournament";
import { GenericButton } from "../common/GenericButton";
import EliminationBracket from "./EliminationBracket";
import MatchCard from "./MatchCard";

interface Props {
  tournament: Tournament;
}

type RoundGroup = {
  key: string;
  stage: MatchStage;
  round: number;
  matches: TournamentMatch[];
};

const STAGE_ORDER = [MatchStage.LEAGUE, MatchStage.ELIMINATION];

const groupRounds = (matches: TournamentMatch[]): RoundGroup[] => {
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

const MatchesTab = ({ tournament }: Props) => {
  const { t } = useTranslation();
  const matches = useGetTournamentMatches(tournament._id);
  const participants = useGetTournamentParticipants(tournament._id);
  const { generateNextRound, isGeneratingRound } = useTournamentActions();

  const names = new Map(participants.map((p) => [p._id, p.name]));
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
  const rounds = groupRounds(matches);
  const latest = rounds[rounds.length - 1];
  const latestKey = latest?.key;
  const isFinished = tournament.status === TournamentStatus.FINISHED;
  const hasPendingTie = matches.some((m) => m.pendingTie);

  return (
    <div className="w-[95%] mx-auto flex flex-col gap-6 my-4">
      <div className="flex items-center gap-3">
        <GenericButton
          variant="primary"
          disabled={isFinished || hasPendingTie}
          isLoading={isGeneratingRound}
          onClick={() => generateNextRound(tournament._id)}
        >
          {tournament.status === TournamentStatus.NOT_STARTED
            ? t("Start Tournament")
            : t("Generate Next Round")}
        </GenericButton>
        {hasPendingTie && (
          <span className="text-sm text-amber-700 font-medium">
            {t("Waiting for tie decision")}
          </span>
        )}
        {isFinished && (
          <span className="text-sm text-green-700 font-medium">
            {t("Tournament finished")}
          </span>
        )}
      </div>

      {matches.some((m) => m.stage === MatchStage.ELIMINATION) && (
        <section className="flex flex-col gap-3">
          <h3 className="font-semibold text-lg">{t("Elimination Bracket")}</h3>
          <EliminationBracket
            tournament={tournament}
            matches={matches}
            names={names}
            editableRound={
              latest?.stage === MatchStage.ELIMINATION
                ? latest.round
                : undefined
            }
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
                  totals={totals}
                  isEditable={group.key === latestKey}
                />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
};

export default MatchesTab;
