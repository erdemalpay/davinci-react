import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Visit } from "../../types";
import { get, patch, post } from ".";
import { useContext } from "react";
import { LocationContext } from "../../context/LocationContext";
import { SelectedDateContext } from "../../context/SelectedDateContext";
import { format } from "date-fns";
import { Paths, useGet } from "./factory";

interface UpdateVisitPayload {
  id: number;
}

export function createVisit(visit: Partial<Visit>): Promise<Visit> {
  return post<Partial<Visit>, Visit>({
    path: `${Paths.Visits}`,
    payload: visit,
  });
}

export function finishVisit({ id }: UpdateVisitPayload): Promise<Visit> {
  return patch<Partial<Visit>, Visit>({
    path: `${Paths.Visits}/finish/${id}`,
    payload: {},
  });
}

export function useGetVisits() {
  const { selectedLocationId } = useContext(LocationContext);
  const { selectedDate } = useContext(SelectedDateContext);
  return useGet<Visit[]>(
    `${Paths.Visits}?location=${selectedLocationId}&date=${selectedDate}`,
    [Paths.Visits, selectedLocationId, selectedDate]
  );
}

export function useGetMonthlyVisits(location: number, date: string) {
  const query = `${Paths.Visits}/monthly?location=${location}&date=${date}`;

  const { isLoading, error, data, isFetching } = useQuery(
    [Paths.Visits, "monthly", location, date],
    () => get<Visit[]>({ path: query })
  );
  return {
    isLoading,
    error,
    visits: data,
    isFetching,
  };
}

export function useCreateVisitMutation() {
  const { selectedLocationId } = useContext(LocationContext);
  const { selectedDate } = useContext(SelectedDateContext);
  const queryClient = useQueryClient();
  const queryKey = [Paths.Visits, selectedLocationId, selectedDate];
  return useMutation(createVisit, {
    // We are updating visits query data with new visit
    onMutate: async (newVisit) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(queryKey);

      // Snapshot the previous value
      const previousVisits = queryClient.getQueryData<Visit[]>(queryKey);

      const updatedVisits = [...(previousVisits as Visit[]), newVisit];

      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, updatedVisits);

      // Return a context object with the snapshotted value
      return { previousVisits };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _newVisit, context) => {
      const previousVisitContext = context as { previousVisits: Visit[] };
      if (previousVisitContext?.previousVisits) {
        const { previousVisits } = previousVisitContext;
        queryClient.setQueryData<Visit[]>(queryKey, previousVisits);
      }
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(queryKey);
    },
  });
}

export function useFinishVisitMutation() {
  const { selectedLocationId } = useContext(LocationContext);
  const { selectedDate } = useContext(SelectedDateContext);
  const queryClient = useQueryClient();
  const queryKey = [Paths.Visits, selectedLocationId, selectedDate];

  return useMutation(finishVisit, {
    // We are updating visits query data with new visit
    onMutate: async ({ id }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(queryKey);

      // Snapshot the previous value
      const previousVisits = queryClient.getQueryData<Visit[]>(queryKey) || [];

      const updatedVisits = [...previousVisits];

      for (let i = 0; i < updatedVisits.length; i++) {
        if (updatedVisits[i]._id === id) {
          updatedVisits[i] = {
            ...updatedVisits[i],
            finishHour: format(new Date(), "HH:mm"),
          };
        }
      }

      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, updatedVisits);

      // Return a context object with the snapshotted value
      return { previousVisits };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _newVisit, context) => {
      const previousVisitContext = context as { previousVisits: Visit[] };
      if (previousVisitContext?.previousVisits) {
        const { previousVisits } = previousVisitContext;
        queryClient.setQueryData<Visit[]>(queryKey, previousVisits);
      }
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(queryKey);
    },
  });
}
