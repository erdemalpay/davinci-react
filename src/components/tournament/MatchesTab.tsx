import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MatchStage,
  PairingMode,
  Tournament,
  TournamentFormat,
  TournamentStatus,
} from "../../types/tournament";
import {
  useGetTournamentMatches,
  useGetTournamentParticipants,
  useGetTournamentStandings,
  useTournamentActions,
} from "../../utils/api/tournament";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import { GenericButton } from "../common/GenericButton";
import CatanPlanOverview from "./CatanPlanOverview";
import { eliminationRoundCount } from "./EliminationBracket";
import MatchesBoard, { groupRounds } from "./MatchesBoard";
import RoundTimer from "./RoundTimer";
import TournamentPodium, {
  podiumOf,
  useFinishConfetti,
} from "./TournamentPodium";
import TvScreen, { requestFullscreen } from "./TvScreen";
import { useSeatEditing } from "./useSeatEditing";

interface Props {
  tournament: Tournament;
}

const MatchesTab = ({ tournament }: Props) => {
  const { t } = useTranslation();
  const matches = useGetTournamentMatches(tournament._id);
  const participants = useGetTournamentParticipants(tournament._id);
  const standings = useGetTournamentStandings(tournament._id);
  const {
    generateNextRound,
    isGeneratingRound,
    regenerateRound,
    isRegeneratingRound,
  } = useTournamentActions();
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [isTvScreenOpen, setIsTvScreenOpen] = useState(false);

  const names = new Map(participants.map((p) => [p._id, p.name]));
  const seatEditing = useSeatEditing(tournament, names);
  const rounds = groupRounds(matches);
  const latest = rounds[rounds.length - 1];
  const isFinished = tournament.status === TournamentStatus.FINISHED;
  const podium = isFinished ? podiumOf(standings) : [];
  // Şampiyonu açıklayan görevli de (ve açıksa TV ekranı) kutlamayı görür; sayfa sonradan açılınca patlamaz
  useFinishConfetti(isFinished);
  const hasPendingTie = matches.some((m) => m.pendingTie);
  // Turda skor girildiyse yeniden eşleştirme oynanmış maçı silerdi; sadece yer değiştirilir
  const isLatestScored = latest?.matches.some((m) => m.isCompleted && !m.isBye);
  // Son tur (final ya da Swiss'in son turu) skorlandıysa kurulacak tur kalmaz; turnuva
  // kendiliğinden bitmez, yanlış skor düzeltilebilsin diye şampiyon elle açıklanır
  const isLastRound =
    latest?.stage === MatchStage.ELIMINATION
      ? latest.matches.filter((m) => !m.isThirdPlace).length === 1
      : tournament.format === TournamentFormat.LEAGUE &&
        latest?.round === tournament.leagueRounds;
  const canFinish =
    !isFinished &&
    !hasPendingTie &&
    isLastRound &&
    latest.matches.every((m) => m.isCompleted);

  return (
    <div className="w-[95%] mx-auto flex flex-col gap-6 my-4">
      <div className="flex flex-wrap items-center gap-3">
        <GenericButton
          variant="primary"
          disabled={isFinished || hasPendingTie}
          isLoading={isGeneratingRound}
          onClick={() =>
            canFinish
              ? setIsFinishDialogOpen(true)
              : generateNextRound(tournament._id)
          }
        >
          {tournament.status === TournamentStatus.NOT_STARTED
            ? t("Start Tournament")
            : canFinish
            ? t("Announce Champion")
            : t("Generate Next Round")}
        </GenericButton>
        {latest && !isFinished && (
          <GenericButton
            variant="outline"
            disabled={isLatestScored}
            isLoading={isRegeneratingRound}
            title={isLatestScored ? t("RegenerateRoundDisabled") : undefined}
            onClick={() => setIsRegenerateDialogOpen(true)}
          >
            {t("Re-pair Round")}
          </GenericButton>
        )}
        <GenericButton
          variant="outline"
          onClick={() => {
            requestFullscreen();
            setIsTvScreenOpen(true);
          }}
        >
          {t("Show On Screen")}
        </GenericButton>
        {latest && (
          <RoundTimer tournament={tournament} roundMatches={latest.matches} />
        )}
        {hasPendingTie && (
          <span className="text-sm text-amber-700 font-medium">
            {t("Waiting for tie decision")}
          </span>
        )}
      </div>
      {podium.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-5">
          <TournamentPodium podium={podium} />
        </div>
      )}
      {tournament.pairingMode === PairingMode.CATAN_PLAN && (
        <CatanPlanOverview participants={participants} />
      )}
      {seatEditing.overlay}
      <ConfirmationDialog
        isOpen={isRegenerateDialogOpen}
        close={() => setIsRegenerateDialogOpen(false)}
        confirm={() => {
          regenerateRound(tournament._id);
          setIsRegenerateDialogOpen(false);
        }}
        title={t("Re-pair Round")}
        text={t("RegenerateRoundMessage", {
          count: participants.filter((p) => p.isActive).length,
        })}
      />

      <ConfirmationDialog
        isOpen={isFinishDialogOpen}
        close={() => setIsFinishDialogOpen(false)}
        confirm={() => {
          generateNextRound(tournament._id);
          setIsFinishDialogOpen(false);
        }}
        title={t("Announce Champion")}
        text={t("AnnounceChampionMessage")}
      />

      {isTvScreenOpen && (
        // İlk eşleştirmeden önce de açılır; oyuncular beklerken QR'ı okutur
        <TvScreen
          tournament={tournament}
          roundMatches={latest?.matches ?? []}
          eliminationRounds={eliminationRoundCount(
            tournament,
            matches,
            participants
          )}
          podium={podium}
          close={() => setIsTvScreenOpen(false)}
        />
      )}

      <MatchesBoard
        tournament={tournament}
        matches={matches}
        participants={participants}
        names={names}
        seatEditing={seatEditing}
      />
    </div>
  );
};

export default MatchesTab;
