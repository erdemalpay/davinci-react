import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { patch } from ".";
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
    });

  return { updateReservation, createReservation };
}

export function useReservationCallMutations() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const { updateItem: updateReservationCall } = useMutationApi<Reservation>({
    baseQuery: Paths.ReservationsCall,
    queryKey: [Paths.Reservations, selectedLocationId, selectedDate],
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
export function updateReservationsOrder({
  id,
  newOrder,
}: {
  id: number;
  newOrder: number;
}) {
  return patch({
    path: `${Paths.Reservations}/reservations_order/${id}`,
    payload: { newOrder },
  });
}
export function useUpdateReservationsOrderMutation() {
  const queryKey = [`${Paths.Reservations}`];
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateReservationsOrder,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
    },

    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
