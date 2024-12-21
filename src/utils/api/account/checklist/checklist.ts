import { Paths, useGetList, useMutationApi } from "../../factory";
import { ChecklistType } from "./../../../../types/index";

const baseUrl = `${Paths.Checklist}`;
export function useChecklistMutations() {
  const {
    deleteItem: deleteChecklist,
    updateItem: updateChecklist,
    createItem: createChecklist,
  } = useMutationApi<ChecklistType>({
    baseQuery: baseUrl,
  });

  return {
    deleteChecklist,
    updateChecklist,
    createChecklist,
  };
}

export function useGetChecklists() {
  return useGetList<ChecklistType>(baseUrl);
}
