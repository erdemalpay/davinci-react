import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { post } from ".";
import { useLocationContext } from "../../context/Location.context";
import { useShiftContext } from "../../context/Shift.context";
import { Shift } from "./../../types/index";
import { Paths, useGetList, useMutationApi } from "./factory";
interface CopyShiftPayload {
  copiedDay: string;
  selectedDay: string;
}

interface CopyShiftIntervalPayload {
  startCopiedDay: string;
  endCopiedDay: string;
  selectedDay: string;
}

export function useShiftMutations() {
  const {
    deleteItem: deleteShift,
    updateItem: updateShift,
    createItem: createShift,
  } = useMutationApi<Shift>({
    baseQuery: Paths.Shift,
  });

  return { deleteShift, updateShift, createShift };
}
export function useGetShifts() {
  const { filterPanelFormElements } = useShiftContext();
  const { selectedLocationId } = useLocationContext();
  let url = `${Paths.Shift}?after=${filterPanelFormElements.after}&location=${selectedLocationId}`;
  const parameters = ["before"];
  parameters.forEach((param) => {
    if (filterPanelFormElements[param]) {
      url = url.concat(
        `&${param}=${encodeURIComponent(filterPanelFormElements[param])}`
      );
    }
  });
  return useGetList<Shift>(
    url,
    [
      `${Paths.Shift}`,
      filterPanelFormElements.after,
      filterPanelFormElements.before,
      selectedLocationId,
    ],
    true
  );
}

export function useGetUserShifts(user:string) {
  const { filterPanelFormElements } = useShiftContext();
  let url = `${Paths.Shift}?after=${filterPanelFormElements.after}&user=${user}`;
  const parameters = ["before"];
  parameters.forEach((param) => {
    if (filterPanelFormElements[param]) {
      url = url.concat(
        `&${param}=${encodeURIComponent(filterPanelFormElements[param])}`
      );
    }
  });
  return useGetList<Shift>(
    url,
    [
      `${Paths.Shift}`,
      filterPanelFormElements.after,
      filterPanelFormElements.before,
      user
    ],
    true
  );
}
export function useGetLocationShifts(location: number) {
  const { filterPanelFormElements } = useShiftContext();
  let url = `${Paths.Shift}?after=${filterPanelFormElements.after}&location=${location}`;
  const parameters = ["before"];
  parameters.forEach((param) => {
    if (filterPanelFormElements[param]) {
      url = url.concat(
        `&${param}=${encodeURIComponent(filterPanelFormElements[param])}`
      );
    }
  });
  return useGetList<Shift>(
    url,
    [
      `${Paths.Shift}`,
      filterPanelFormElements.after,
      filterPanelFormElements.before,
      location,
    ],
    true
  );
}

function copyShift(payload: CopyShiftPayload) {
  return post({
    path: `/shift/copy`,
    payload,
  });
}

function copyShiftInterval(payload: CopyShiftIntervalPayload) {
  return post({
    path: `/shift/copy-interval`,
    payload,
  });
}

export function useCopyShiftMutation() {
  const queryClient = useQueryClient();
  return useMutation(copyShift, {
    onMutate: async () => {
      await queryClient.cancelQueries([`${Paths.Shift}`]);
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}

export function useCopyShiftIntervalMutation() {
  const queryClient = useQueryClient();
  return useMutation(copyShiftInterval, {
    onMutate: async () => {
      await queryClient.cancelQueries([`${Paths.Shift}`]);
    },
    onError: (_err: any) => {
      const errorMessage =
        _err?.response?.data?.message || "An unexpected error occurred";
      setTimeout(() => toast.error(errorMessage), 200);
    },
  });
}
