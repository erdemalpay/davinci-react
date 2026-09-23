import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TournamentMatch } from "../../types/tournament";
import { useTournamentActions } from "../../utils/api/tournament";
import { GenericButton } from "../common/GenericButton";

interface Props {
  match: TournamentMatch;
  names: Map<number, string>;
  isEditable: boolean;
}

const MatchCard = ({ match, names, isEditable }: Props) => {
  const { t } = useTranslation();
  const { submitScores } = useTournamentActions();
  const [scores, setScores] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      match.players.map((p) => [p.participantId, p.score?.toString() ?? ""])
    )
  );

  const isFilled = match.players.every((p) => scores[p.participantId] !== "");
  const canEdit = isEditable && !match.isBye;

  const save = () =>
    submitScores({
      matchId: match._id,
      scores: match.players.map((p) => ({
        participantId: p.participantId,
        score: Number(scores[p.participantId]),
      })),
    });

  if (match.isBye) {
    const [player] = match.players;
    return (
      <div className="border rounded-md p-3 bg-gray-50 text-sm">
        <span className="font-medium">{t("Bye")}:</span>{" "}
        {names.get(player.participantId)} (+{player.points})
      </div>
    );
  }

  // Skor girildiyse sıraya göre, girilmediyse oturma sırasıyla göster
  const players = match.isCompleted
    ? [...match.players].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    : match.players;

  return (
    <div
      className={`border rounded-md p-3 flex flex-col gap-2 ${
        match.isCompleted ? "bg-green-50" : "bg-white"
      }`}
    >
      <p className="font-semibold text-sm">
        {t("Table")} {match.tableNo}
      </p>
      {players.map((player) => (
        <div
          key={player.participantId}
          className="flex items-center gap-2 text-sm"
        >
          {match.isCompleted && (
            <span className="w-6 text-gray-500">{player.rank}.</span>
          )}
          <span className="flex-1">{names.get(player.participantId)}</span>
          {canEdit ? (
            <input
              type="number"
              className="w-20 border rounded px-2 py-1"
              placeholder={t("Score")}
              value={scores[player.participantId]}
              onChange={(e) =>
                setScores({ ...scores, [player.participantId]: e.target.value })
              }
            />
          ) : (
            <span className="w-20 text-right">{player.score ?? "-"}</span>
          )}
          {match.isCompleted && (
            <span className="w-14 text-right font-medium">
              +{player.points}
            </span>
          )}
        </div>
      ))}
      {canEdit && (
        <GenericButton
          size="sm"
          variant="primary"
          disabled={!isFilled}
          onClick={save}
        >
          {match.isCompleted ? t("Update Scores") : t("Save Scores")}
        </GenericButton>
      )}
    </div>
  );
};

export default MatchCard;
