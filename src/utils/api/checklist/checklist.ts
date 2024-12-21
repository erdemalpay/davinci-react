import { ChecklistType } from "../../../types/index";
import { Paths, useGetList, useMutationApi } from "../factory";

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
