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
  const rounds = groupRounds(matches);
  const latestKey = rounds[rounds.length - 1]?.key;
  const isFinished = tournament.status === TournamentStatus.FINISHED;

  const roundTitle = (group: RoundGroup) => {
    if (group.stage === MatchStage.LEAGUE)
      return t("League Round N", { round: group.round });
    const tableCount = group.matches.filter((m) => !m.isBye).length;
    return tableCount === 1
      ? t("Final")
      : t("Elimination Round N", { round: group.round });
  };

  return (
    <div className="w-[95%] mx-auto flex flex-col gap-6 my-4">
      <div className="flex items-center gap-3">
        <GenericButton
          variant="primary"
          disabled={isFinished}
          isLoading={isGeneratingRound}
          onClick={() => generateNextRound(tournament._id)}
        >
          {tournament.status === TournamentStatus.NOT_STARTED
            ? t("Start Tournament")
            : t("Generate Next Round")}
        </GenericButton>
        {isFinished && (
          <span className="text-sm text-green-700 font-medium">
            {t("Tournament finished")}
          </span>
        )}
      </div>

      {/* En yeni tur en üstte */}
      {[...rounds].reverse().map((group) => (
        <section key={group.key} className="flex flex-col gap-3">
          <h3 className="font-semibold text-lg">{roundTitle(group)}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.matches.map((match) => (
              <MatchCard
                key={match._id}
                match={match}
                names={names}
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
