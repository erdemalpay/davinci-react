import { useShiftContext } from "../../context/Shift.context";
import { Shift } from "./../../types/index";
import { Paths, useGetList, useMutationApi } from "./factory";

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
