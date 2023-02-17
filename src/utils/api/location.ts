import { Location } from "../../types";
import { Paths, useGetList } from "./factory";

export function useGetLocations() {
  return useGetList<Location>(Paths.Location);
}
