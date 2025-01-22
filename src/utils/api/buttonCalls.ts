import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patch } from ".";
import { ButtonCall } from "../../types";
import { Paths, useGetList, useMutationApi } from "./factory";
import { useLocationContext } from "../../context/Location.context";
import { useDateContext } from "../../context/Date.context";
import { toast } from "react-toastify";

interface UpdateButtonCallPayload {
  id: string;
}
export function useGameMutations() {
  const {
    updateItem: closeButtonCall,
  } = useMutationApi<ButtonCall>({
    baseQuery: Paths.Games,
  });

  return { closeButtonCall };
}

export function useGetGames() {
  return useGetList<ButtonCall>(Paths.ButtonCalls);
}

export function useGetButtonCalls() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  return useGetList<ButtonCall>(
    `${Paths.ButtonCalls}?location=${selectedLocationId}&date=${selectedDate}`,
    [Paths.ButtonCalls, selectedLocationId, selectedDate]
  );
}
export function finishButtonCall({ id }: UpdateButtonCallPayload): Promise<ButtonCall> {
  return patch<Partial<ButtonCall>, ButtonCall>({
    path: `${Paths.ButtonCalls}`,
    payload: {_id: id},
  });
}
export function useFinishButtonCallMutation() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const queryClient = useQueryClient();
  const queryKey = [Paths.ButtonCalls, selectedLocationId, selectedDate];

  return useMutation(finishButtonCall, {
    // We are updating visits query data with new visit
    onMutate: async ({ id }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(queryKey);

      // Snapshot the previous value
      const previousButtonCalls = queryClient.getQueryData<ButtonCall[]>(queryKey) || [];

      const updatedButtonCalls = [...previousButtonCalls];

      for (let i = 0; i < updatedButtonCalls.length; i++) {
        if (updatedButtonCalls[i]._id === id) {
          updatedButtonCalls[i] = {
            ...updatedButtonCalls[i]
          };
        }
      }

      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, updatedButtonCalls);

      // Return a context object with the snapshotted value
      return { previousButtonCalls };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err: any, _newButtonCall, context) => {
      const previousButtonCallContext = context as { previousButtonCalls: ButtonCall[] };
      if (previousButtonCallContext?.previousButtonCalls) {
        const { previousButtonCalls } = previousButtonCallContext;
        queryClient.setQueryData<ButtonCall[]>(queryKey, previousButtonCalls);
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