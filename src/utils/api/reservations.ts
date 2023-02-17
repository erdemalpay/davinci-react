import { useDateContext } from "../../context/Date.context";
import { useLocationContext } from "../../context/Location.context";
import { Reservation } from "../../types/index";
import { Paths, useGetList, useMutationApi } from "./factory";

export function useReservationMutations() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const { updateItem: updateReservation, createItem: createReservation } =
    useMutationApi<Reservation>({
      baseQuery: Paths.Reservations,
      queryKey: [Paths.Reservations, selectedLocationId, selectedDate],
      needsRevalidate: false,
    });

  return { updateReservation, createReservation };
}

export function useReservationCallMutations() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const { updateItem: updateReservationCall } = useMutationApi<Reservation>({
    baseQuery: Paths.ReservationsCall,
    queryKey: [Paths.Reservations, selectedLocationId, selectedDate],
    needsRevalidate: false,
  });

  return { updateReservationCall };
}

export function useGetReservations() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  return useGetList<Reservation>(
    `${Paths.Reservations}?location=${selectedLocationId}&date=${selectedDate}`,
    [Paths.Reservations, selectedLocationId, selectedDate]
  );
}
