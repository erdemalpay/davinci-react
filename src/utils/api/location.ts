import { Location } from "../../types";
import { Paths, useGetList, useMutationApi } from "./factory";

const baseUrl = Paths.Location;
export function useLocationMutations() {
  const { updateItem: updateLocation, createItem: createStockLocation } =
    useMutationApi<Location>({
      baseQuery: baseUrl,
    });
  return { updateLocation, createStockLocation };
}
export function useGetStoreLocations() {
  return useGetList<Location>(baseUrl);
}

export function useGetStockLocations() {
  const url = `${Paths.Location}/stock`;
  return useGetList<Location>(url);
}

export function useGetAllLocations() {
  const url = `${Paths.Location}/all`;
  return useGetList<Location>(url);
}
