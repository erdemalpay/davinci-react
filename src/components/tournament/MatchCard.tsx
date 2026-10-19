import { useTranslation } from "react-i18next";
import { MatchStage, TournamentMatch } from "../../types/tournament";
import {
  ChosenInTieBadge,
  SaveScoresButton,
  TieBreakPicker,
  useScoreEntry,
} from "./useScoreEntry";
import { MoveHereButton, SeatActions, SeatEditing } from "./useSeatEditing";

interface Props {
  match: TournamentMatch;
  names: Map<number, string>;
  totals: Map<number, number>;
  isEditable: boolean;
  seatEditing: SeatEditing;
}

const MatchCard = ({
  match,
  names,
  totals,
  isEditable,
  seatEditing,
}: Props) => {
  const { t } = useTranslation();
  const { scores, setScore, isFilled, save } = useScoreEntry(match);
  const canEdit = isEditable && !match.isBye;

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
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-sm">
          {t("Table")} {match.tableNo}
        </p>
        {canEdit && <MoveHereButton match={match} seatEditing={seatEditing} />}
      </div>
      {players.map((player) => (
        <div
          key={player.participantId}
          className={`flex items-center gap-2 text-sm ${
            seatEditing.isSelected(player.participantId)
              ? "rounded bg-blue-100"
              : ""
          }`}
        >
          {match.isCompleted && (
            <span className="w-6 text-gray-500">{player.rank}.</span>
          )}
          <span className="flex-1">
            {names.get(player.participantId)}
            {player.wonTieBreak && <ChosenInTieBadge />}
          </span>
          {canEdit ? (
            <input
              type="number"
              className="w-20 border rounded px-2 py-1"
              placeholder={t("Score")}
              value={scores[player.participantId]}
              onChange={(e) => setScore(player.participantId, e.target.value)}
            />
          ) : (
            <span className="w-20 text-right">{player.score ?? "-"}</span>
          )}
          {match.isCompleted && match.stage === MatchStage.LEAGUE && (
            <span className="w-14 text-right font-medium">
              +{player.points}
            </span>
          )}
          {canEdit && (
            <SeatActions
              match={match}
              participantId={player.participantId}
              seatEditing={seatEditing}
            />
          )}
        </div>
      ))}
      {canEdit && (
        <SaveScoresButton match={match} isFilled={isFilled} save={save} />
      )}
      {canEdit && (
        // Üçlü eşitlikte ikinci soru geldiğinde önceki seçim temizlensin
        <TieBreakPicker
          key={match.pendingTie?.participantIds.join()}
          match={match}
          names={names}
        />
      )}
    </div>
  );
};

export default MatchCard;
