import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { post } from ".";
import { useShiftContext } from "../../context/Shift.context";
import { Shift } from "./../../types/index";
import { Paths, useGetList, useMutationApi } from "./factory";
interface CopyShiftPayload {
  copiedDay: string;
  selectedDay: string;
  selectedUsers?: string[];
}

interface AddShiftPayload {
  day: string;
  location: number;
  shift: string;
  userId: string;
  shiftEndHour?: string;
}

interface CopyShiftIntervalPayload {
  startCopiedDay: string;
  endCopiedDay: string;
  selectedDay: string;
  selectedUsers?: string[];
}

export function useShiftMutations(
  after?: string,
  before?: string,
  location?: number
) {
  const {
    deleteItem: deleteShift,
    updateItem: updateShift,
    createItem: createShift,
  } = useMutationApi<Shift>({
    baseQuery: Paths.Shift,
    queryKey: [Paths.Shift, after, before, location],
    isInvalidate: true,
  });

  return { deleteShift, updateShift, createShift };
}
export function useGetShifts(
  after?: string,
  before?: string,
  location?: number
) {
  let url = `${Paths.Shift}?after=${after}`;
  if (before) {
    url = url.concat(`&before=${before}`);
  }
  if (location !== undefined && location !== -1) {
    url = url.concat(`&location=${location}`);
  }
  return useGetList<Shift>(
    url,
    [`${Paths.Shift}`, after, before, location],
    true
  );
}

export function useGetUserShifts(
  after?: string,
  before?: string,
  user?: string
) {
  let url = `${Paths.Shift}/user?`;
  if (after) {
    url = url.concat(`after=${after}`);
  }
  if (before) {
    url = url.concat(`&before=${before}`);
  }
  if (location) {
    url = url.concat(`&location=${location}`);
  }
  return useGetList<Shift>(url, [`${Paths.Shift}`, after, before, user], true);
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

function addShift(payload: AddShiftPayload) {
  return post({
    path: `/shift/add`,
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

export function useAddShiftMutation() {
  const queryClient = useQueryClient();
  return useMutation(addShift, {
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
