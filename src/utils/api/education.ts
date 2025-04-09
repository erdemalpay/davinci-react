import { Education } from "./../../types/index";
import { Paths, useGetList, useMutationApi } from "./factory";

export function useEducationMutations() {
  const {
    deleteItem: deleteEducation,
    updateItem: updateEducation,
    createItem: createEducation,
  } = useMutationApi<Education>({
    baseQuery: Paths.Education,
  });

  return { deleteEducation, updateEducation, createEducation };
}

export function useGetEducations() {
  return useGetList<Education>(Paths.Education);
}
