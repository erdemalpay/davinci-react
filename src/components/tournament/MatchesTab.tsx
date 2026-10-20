import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tournament, TournamentStatus } from "../../types/tournament";
import {
  useGetTournamentMatches,
  useGetTournamentParticipants,
  useTournamentActions,
} from "../../utils/api/tournament";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import { GenericButton } from "../common/GenericButton";
import MatchesBoard, { groupRounds } from "./MatchesBoard";
import RoundTimer from "./RoundTimer";
import TvScreen, { requestFullscreen } from "./TvScreen";
import { useSeatEditing } from "./useSeatEditing";

interface Props {
  tournament: Tournament;
}

const MatchesTab = ({ tournament }: Props) => {
  const { t } = useTranslation();
  const matches = useGetTournamentMatches(tournament._id);
  const participants = useGetTournamentParticipants(tournament._id);
  const {
    generateNextRound,
    isGeneratingRound,
    regenerateRound,
    isRegeneratingRound,
  } = useTournamentActions();
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [isTvScreenOpen, setIsTvScreenOpen] = useState(false);

  const names = new Map(participants.map((p) => [p._id, p.name]));
  const seatEditing = useSeatEditing(tournament, names);
  const rounds = groupRounds(matches);
  const latest = rounds[rounds.length - 1];
  const isFinished = tournament.status === TournamentStatus.FINISHED;
  const hasPendingTie = matches.some((m) => m.pendingTie);
  // Turda skor girildiyse yeniden eşleştirme oynanmış maçı silerdi; sadece yer değiştirilir
  const isLatestScored = latest?.matches.some((m) => m.isCompleted && !m.isBye);

  return (
    <div className="w-[95%] mx-auto flex flex-col gap-6 my-4">
      <div className="flex flex-wrap items-center gap-3">
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
        {isFinished && (
          <span className="text-sm text-green-700 font-medium">
            {t("Tournament finished")}
          </span>
        )}
      </div>
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

      {isTvScreenOpen && (
        // İlk eşleştirmeden önce de açılır; oyuncular beklerken QR'ı okutur
        <TvScreen
          tournament={tournament}
          roundMatches={latest?.matches ?? []}
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
