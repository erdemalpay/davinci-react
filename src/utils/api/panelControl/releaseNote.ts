import { ReleaseNote } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.PanelControl}/release-notes`;

export function useGetReleaseNotes() {
  return useGetList<ReleaseNote>(baseUrl);
}

export function useReleaseNoteMutations() {
  const {
    deleteItem: deleteReleaseNote,
    updateItem: updateReleaseNote,
    createItem: createReleaseNote,
  } = useMutationApi<ReleaseNote>({
    baseQuery: baseUrl,
  });
  return {
    deleteReleaseNote,
    updateReleaseNote,
    createReleaseNote,
  };
}
