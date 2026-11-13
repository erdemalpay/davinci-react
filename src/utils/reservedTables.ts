import { Reservation, ReservationStatusEnum } from "../types";

// Tables held for reservations that are on their way.
export function getComingReservedTableNames(
  reservations: Reservation[] | undefined,
  location: number | undefined
): Set<string> {
  return new Set(
    (reservations ?? [])
      .filter(
        (reservation) =>
          reservation.status === ReservationStatusEnum.COMING &&
          reservation.location === location &&
          reservation.reservedTable
      )
      .map((reservation) => reservation.reservedTable)
  );
}
