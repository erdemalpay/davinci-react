import { Paths, useGetList, useMutationApi } from "../factory";
import { TaskTrack } from "./../../../types/index";

const baseUrl = `${Paths.PanelControl}/task-tracks`;

export function useTaskTrackMutations() {
  const {
    deleteItem: deleteTaskTrack,
    updateItem: updateTaskTrack,
    createItem: createTaskTrack,
  } = useMutationApi<TaskTrack>({
    baseQuery: baseUrl,
  });
  return {
    deleteTaskTrack,
    updateTaskTrack,
    createTaskTrack,
  };
}
export function useGetTaskTracks() {
  return useGetList<TaskTrack>(baseUrl);
}
