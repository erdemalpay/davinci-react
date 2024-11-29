import { Location } from "../../types";
import { Paths, useGetList } from "./factory";

export function useGetLocations() {
  return useGetList<Location>(Paths.Location);
}

export function useGetStockLocations() {
  const url = `${Paths.Location}/stock`;
  return useGetList<Location>(url);
}
