import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { get, patch, post } from ".";
import { useDateContext } from "../../context/Date.context";
import { useLocationContext } from "../../context/Location.context";
import { Visit } from "../../types";
import { Paths, useGetList } from "./factory";
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
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  return useGetList<Visit>(
    `${Paths.Visits}?location=${selectedLocationId}&date=${selectedDate}`,
    [Paths.Visits, selectedLocationId, selectedDate]
  );
}

export function useGetFilteredVisits(startDate: string, endDate?: string) {
  let url = `${Paths.Visits}/kalender?start-date=${startDate}`;
  if (endDate) {
    url = url.concat(`&end-date=${endDate}`);
  }
  return useGetList<Visit>(url, [Paths.Visits, startDate, endDate]);
}
export function useGetUniqueVisits(startDate: string, endDate?: string) {
  let url = `${Paths.Visits}/panel?start-date=${startDate}`;
  if (endDate) {
    url = url.concat(`&end-date=${endDate}`);
  }
  return useGetList<Visit>(url, [Paths.Visits, startDate, endDate]);
}

export function useGetGivenDateVisits(date: string) {
  const { selectedLocationId } = useLocationContext();
  return useGetList<Visit>(
    `${Paths.Visits}?location=${selectedLocationId}&date=${date}`,
    [Paths.Visits, selectedLocationId, date]
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
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
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
    onError: (_err: any, _newVisit, context) => {
      const previousVisitContext = context as { previousVisits: Visit[] };
      if (previousVisitContext?.previousVisits) {
        const { previousVisits } = previousVisitContext;
        queryClient.setQueryData<Visit[]>(queryKey, previousVisits);
      }
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(queryKey);
    },
  });
}

export function useFinishVisitMutation() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
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
    onError: (_err: any, _newVisit, context) => {
      const previousVisitContext = context as { previousVisits: Visit[] };
      if (previousVisitContext?.previousVisits) {
        const { previousVisits } = previousVisitContext;
        queryClient.setQueryData<Visit[]>(queryKey, previousVisits);
      }
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(queryKey);
    },
  });
}
