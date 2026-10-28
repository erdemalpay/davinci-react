import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { TbArrowsRightLeft } from "react-icons/tb";
import {
  MatchStage,
  Tournament,
  TournamentMatch,
} from "../../types/tournament";
import { useTournamentActions } from "../../utils/api/tournament";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import { GenericButton } from "../common/GenericButton";
import { eliminationSize } from "./useTournamentForm";

type Seat = { participantId: number; matchId: number };

// Maç kartı ve eleme ağacı aynı masa düzenlemesini kullanır: son turun skoru
// girilmemiş masalarında oyuncu çıkarılır, yer değiştirilir ya da başka masaya taşınır.
export const useSeatEditing = (
  tournament: Tournament,
  names: Map<number, string>
) => {
  const { t } = useTranslation();
  const { moveParticipant, removeParticipant } = useTournamentActions();
  const [selected, setSelected] = useState<Seat>();
  const [toRemove, setToRemove] = useState<number>();

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(undefined);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  const moveTo = (matchId: number, swapWithId?: number) => {
    if (!selected) return;
    moveParticipant({
      participantId: selected.participantId,
      matchId,
      swapWithId,
    });
    setSelected(undefined);
  };

  const capacity = (match: TournamentMatch) =>
    match.stage === MatchStage.ELIMINATION
      ? eliminationSize(tournament)
      : tournament.tableSize;
  const canMoveTo = (match: TournamentMatch) =>
    !!selected &&
    !match.isCompleted &&
    match._id !== selected.matchId &&
    match.players.length < capacity(match);

  const overlay = (
    <>
      {selected && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          <span>
            {t("SeatSelectionHint", {
              name: names.get(selected.participantId),
            })}
          </span>
          <GenericButton
            size="sm"
            variant="outline"
            onClick={() => setSelected(undefined)}
          >
            {t("Cancel")}
          </GenericButton>
        </div>
      )}
      <ConfirmationDialog
        isOpen={toRemove !== undefined}
        close={() => setToRemove(undefined)}
        confirm={() => {
          if (toRemove !== undefined) removeParticipant(toRemove);
          setToRemove(undefined);
        }}
        title={t("Remove Participant")}
        text={t("RemoveParticipantMessage", {
          name: toRemove !== undefined ? names.get(toRemove) : "",
        })}
      />
    </>
  );

  return {
    selected,
    isSelected: (participantId: number) =>
      selected?.participantId === participantId,
    select: setSelected,
    moveTo,
    remove: setToRemove,
    canMoveTo,
    overlay,
  };
};

export type SeatEditing = ReturnType<typeof useSeatEditing>;

interface SeatActionsProps {
  match: TournamentMatch;
  participantId: number;
  seatEditing: SeatEditing;
}

// Oyuncu satırının sonundaki düğmeler: seçim yokken "yer değiştir" ve "çıkar",
// bir oyuncu seçiliyken başka masadakilerde "bununla yer değiştir"
export const SeatActions = ({
  match,
  participantId,
  seatEditing,
}: SeatActionsProps) => {
  const { t } = useTranslation();
  const { selected, isSelected, select, moveTo, remove } = seatEditing;
  if (match.isCompleted) return null;

  if (selected) {
    if (isSelected(participantId))
      return (
        <button
          className="text-blue-600 text-lg"
          title={t("Cancel")}
          onClick={() => select(undefined)}
        >
          <TbArrowsRightLeft />
        </button>
      );
    if (selected.matchId === match._id) return null;
    return (
      <button
        className="text-blue-500 hover:text-blue-700 text-lg"
        title={t("Swap with this player")}
        onClick={() => moveTo(match._id, participantId)}
      >
        <TbArrowsRightLeft />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        className="text-gray-500 hover:text-blue-600 text-lg"
        title={t("Change seat")}
        onClick={() => select({ participantId, matchId: match._id })}
      >
        <TbArrowsRightLeft />
      </button>
      <button
        className="text-red-500 hover:text-red-700 text-lg"
        title={t("Remove Participant")}
        onClick={() => remove(participantId)}
      >
        <HiOutlineTrash />
      </button>
    </div>
  );
};

// Seçili oyuncunun taşınabileceği (yeri olan) masalarda görünür
export const MoveHereButton = ({
  match,
  seatEditing,
}: {
  match: TournamentMatch;
  seatEditing: SeatEditing;
}) => {
  const { t } = useTranslation();
  if (!seatEditing.canMoveTo(match)) return null;
  return (
    <GenericButton
      size="sm"
      variant="outline"
      onClick={() => seatEditing.moveTo(match._id)}
    >
      {t("Move Here")}
    </GenericButton>
  );
};
