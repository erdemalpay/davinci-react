import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { post } from ".";
import { useShiftContext } from "../../context/Shift.context";
import { Shift } from "./../../types/index";
import { Paths, useGetList, useMutationApi } from "./factory";

interface CopyShiftPayload {
  copiedDay: string;
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
  let url = `${Paths.Shift}?after=${filterPanelFormElements.after}`;
  const parameters = ["before", "location"];
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
      filterPanelFormElements.location,
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
