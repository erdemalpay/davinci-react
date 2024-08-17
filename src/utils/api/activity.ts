import { Activity } from "../../types";
import { Paths, useGetList } from "./factory";

export function useGetActivities() {
  return useGetList<Activity>(Paths.Activity);
}
