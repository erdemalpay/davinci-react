import { TournamentParticipant } from "../../types/tournament";

type PlannedParticipant = Pick<
  TournamentParticipant,
  "_id" | "name" | "isActive" | "schedule" | "drawNumber"
>;

export interface PlannedSeat {
  seat: number;
  participantId: number;
  name: string;
  isActive: boolean;
  drawNumber?: number;
}

export interface PlannedTable {
  tableNo: number;
  seats: PlannedSeat[];
}

export interface PlannedRound {
  round: number;
  tables: PlannedTable[];
}

// Numaraları çekilmiş katılımcıların programından tur tur, masa masa kimin hangi sırada oturacağı
export const groupCatanPlan = (
  participants: PlannedParticipant[]
): PlannedRound[] => {
  const rounds = new Map<number, Map<number, PlannedSeat[]>>();
  participants.forEach((p) =>
    p.schedule?.forEach((slot) => {
      const tables = rounds.get(slot.round) ?? new Map<number, PlannedSeat[]>();
      tables.set(slot.tableNo, [
        ...(tables.get(slot.tableNo) ?? []),
        {
          seat: slot.seat,
          participantId: p._id,
          name: p.name,
          isActive: p.isActive,
          drawNumber: p.drawNumber,
        },
      ]);
      rounds.set(slot.round, tables);
    })
  );
  return [...rounds]
    .sort(([a], [b]) => a - b)
    .map(([round, tables]) => ({
      round,
      tables: [...tables]
        .sort(([a], [b]) => a - b)
        .map(([tableNo, seats]) => ({
          tableNo,
          seats: [...seats].sort((a, b) => a.seat - b.seat),
        })),
    }));
};
