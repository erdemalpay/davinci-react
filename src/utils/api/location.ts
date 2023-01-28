import { Location } from "../../types";
import { Paths, useGet } from "./factory";

export function useGetLocations() {
  return useGet<Location[]>(Paths.Location);
}
