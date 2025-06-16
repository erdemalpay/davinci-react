import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { post } from ".";
import { useDateContext } from "../../context/Date.context";
import { useLocationContext } from "../../context/Location.context";
import { ButtonCall, ButtonCallType } from "../../types";
import { Paths, useGetList } from "./factory";

interface UpdateButtonCallPayload {
  location: number;
  tableName: string;
  hour: string;
}
export function useGetActiveButtonCalls(type = ButtonCallType.ACTIVE) {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  return useGetList<ButtonCall>(
    `${Paths.ButtonCalls}?location=${selectedLocationId}&date=${selectedDate}&type=${type}`,
    [Paths.ButtonCalls, selectedLocationId, selectedDate, type]
  );
}
export function useGetButtonCalls() {
  return useGetList<ButtonCall>(Paths.ButtonCalls);
}
export function finishButtonCall({
  location,
  tableName,
  hour,
}: UpdateButtonCallPayload): Promise<ButtonCall> {
  return post<UpdateButtonCallPayload, ButtonCall>({
    path: `${Paths.ButtonCalls}/close-from-panel`,
    payload: { location: location, tableName: tableName, hour: hour },
  });
}
export function useFinishButtonCallMutation() {
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const queryClient = useQueryClient();
  const queryKey = [Paths.ButtonCalls, selectedLocationId, selectedDate];

  return useMutation(finishButtonCall, {
    // We are updating visits query data with new visit
    onMutate: async ({ tableName }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(queryKey);

      // Snapshot the previous value
      const previousButtonCalls =
        queryClient.getQueryData<ButtonCall[]>(queryKey) || [];

      const updatedButtonCalls = [...previousButtonCalls];

      for (let i = 0; i < updatedButtonCalls.length; i++) {
        if (updatedButtonCalls[i].tableName === tableName) {
          updatedButtonCalls[i] = {
            ...updatedButtonCalls[i],
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
      const previousButtonCallContext = context as {
        previousButtonCalls: ButtonCall[];
      };
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
