import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MatchStage, TournamentMatch } from "../../types/tournament";
import { useTournamentActions } from "../../utils/api/tournament";
import { GenericButton } from "../common/GenericButton";

interface Props {
  match: TournamentMatch;
  names: Map<number, string>;
  totals: Map<number, number>;
  isEditable: boolean;
}

const MatchCard = ({ match, names, totals, isEditable }: Props) => {
  const { t } = useTranslation();
  const { submitScores, resolveTie } = useTournamentActions();
  const [tieWinners, setTieWinners] = useState<number[]>([]);
  const [scores, setScores] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      match.players.map((p) => [p.participantId, p.score?.toString() ?? ""])
    )
  );

  const { pendingTie } = match;
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
        {names.get(player.participantId)}
        {player.points !== undefined && ` (+${player.points})`}
      </div>
    );
  }

  // Skor girildiyse masadaki sıraya göre; girilmediyse puan turlarında o anki toplama
  // göre (elemede masalar zaten sıralamaya göre kurulduğu için oturma sırası)
  const players = match.isCompleted
    ? [...match.players].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    : match.stage === MatchStage.LEAGUE
    ? [...match.players].sort(
        (a, b) =>
          (totals.get(b.participantId) ?? 0) -
          (totals.get(a.participantId) ?? 0)
      )
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
          <span className="flex-1">
            {names.get(player.participantId)}
            {player.wonTieBreak && (
              <span className="ml-2 text-[10px] rounded bg-amber-100 text-amber-700 px-1">
                {t("Chosen in tie")}
              </span>
            )}
          </span>
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
          {match.isCompleted && match.stage === MatchStage.LEAGUE && (
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
      {canEdit && pendingTie && (
        <div className="border border-amber-300 bg-amber-50 rounded p-2 flex flex-col gap-2 text-sm">
          <p className="font-medium text-amber-800">
            {t("TieBreakQuestion", { count: pendingTie.slots })}
          </p>
          {pendingTie.participantIds.map((participantId) => (
            <label key={participantId} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={tieWinners.includes(participantId)}
                onChange={() =>
                  setTieWinners((prev) =>
                    prev.includes(participantId)
                      ? prev.filter((id) => id !== participantId)
                      : [...prev, participantId]
                  )
                }
              />
              {names.get(participantId)}
            </label>
          ))}
          <GenericButton
            size="sm"
            variant="primary"
            disabled={tieWinners.length !== pendingTie.slots}
            onClick={() =>
              resolveTie({ matchId: match._id, winnerIds: tieWinners })
            }
          >
            {t("Save Decision")}
          </GenericButton>
        </div>
      )}
    </div>
  );
};

export default MatchCard;
