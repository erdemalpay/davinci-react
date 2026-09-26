import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TournamentMatch } from "../../types/tournament";
import { useTournamentActions } from "../../utils/api/tournament";
import { GenericButton } from "../common/GenericButton";

// Maç kartı ve eleme ağacı kutusu aynı skor girişini kullanır. Sadece elle değiştirilen
// değerler tutulur; gerisi maçtan okunur ki başka ekrandan girilen skor da görünsün.
export const useScoreEntry = (match: TournamentMatch) => {
  const { submitScores } = useTournamentActions();
  const [edits, setEdits] = useState<Record<number, string>>({});
  const scores: Record<number, string> = Object.fromEntries(
    match.players.map((p) => [
      p.participantId,
      edits[p.participantId] ?? p.score?.toString() ?? "",
    ])
  );

  const setScore = (participantId: number, value: string) =>
    setEdits((prev) => ({ ...prev, [participantId]: value }));
  const isFilled = match.players.every((p) => scores[p.participantId] !== "");
  const save = () =>
    submitScores({
      matchId: match._id,
      scores: match.players.map((p) => ({
        participantId: p.participantId,
        score: Number(scores[p.participantId]),
      })),
    });

  return { scores, setScore, isFilled, save };
};

interface TieBreakPickerProps {
  match: TournamentMatch;
  names: Map<number, string>;
}

// Eleme masasında çıkış sınırında eşitlik varsa kimin üst sıraya geçeceğini sordurur
export const TieBreakPicker = ({ match, names }: TieBreakPickerProps) => {
  const { t } = useTranslation();
  const { resolveTie } = useTournamentActions();
  const [winners, setWinners] = useState<number[]>([]);
  const { pendingTie } = match;
  if (!pendingTie) return null;

  const toggle = (participantId: number) =>
    setWinners((prev) =>
      prev.includes(participantId)
        ? prev.filter((id) => id !== participantId)
        : [...prev, participantId]
    );

  return (
    <div className="border border-amber-300 bg-amber-50 rounded p-2 flex flex-col gap-2 text-sm">
      <p className="font-medium text-amber-800">
        {t("TieBreakQuestion", { count: pendingTie.slots })}
      </p>
      {pendingTie.participantIds.map((participantId) => (
        <label key={participantId} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={winners.includes(participantId)}
            onChange={() => toggle(participantId)}
          />
          {names.get(participantId)}
        </label>
      ))}
      <GenericButton
        size="sm"
        variant="primary"
        disabled={winners.length !== pendingTie.slots}
        onClick={() => resolveTie({ matchId: match._id, winnerIds: winners })}
      >
        {t("Save Decision")}
      </GenericButton>
    </div>
  );
};
