import { Paths, useGet, useMutationApi } from "./factory";
import { Reservation } from "../../types/index";
import { useContext } from "react";
import { LocationContext } from "../../context/LocationContext";
import { SelectedDateContext } from "../../context/SelectedDateContext";

export function useReservationMutations() {
  const { selectedLocationId } = useContext(LocationContext);
  const { selectedDate } = useContext(SelectedDateContext);
  const { updateItem: updateReservation, createItem: createReservation } =
    useMutationApi<Reservation>({
      baseQuery: Paths.Reservations,
      queryKey: [Paths.Reservations, selectedLocationId, selectedDate],
      needsRevalidate: false,
    });

  return { updateReservation, createReservation };
}

export function useReservationCallMutations() {
  const { selectedLocationId } = useContext(LocationContext);
  const { selectedDate } = useContext(SelectedDateContext);
  const { updateItem: updateReservationCall } = useMutationApi<Reservation>({
    baseQuery: Paths.ReservationsCall,
    queryKey: [Paths.Reservations, selectedLocationId, selectedDate],
    needsRevalidate: false,
  });

  return { updateReservationCall };
}

export function useGetReservations() {
  const { selectedLocationId } = useContext(LocationContext);
  const { selectedDate } = useContext(SelectedDateContext);
  return useGet<Reservation[]>(
    `${Paths.Reservations}?location=${selectedLocationId}&date=${selectedDate}`,
    [Paths.Reservations, selectedLocationId, selectedDate]
  );
}
