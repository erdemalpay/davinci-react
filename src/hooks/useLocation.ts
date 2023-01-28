import { useContext } from "react";
import { LocationContext } from "../context/LocationContext";
import { useGetLocations } from "../utils/api/location";
import { Location } from "../types";

export function useLocation() {
  const { selectedLocationId } = useContext(LocationContext);
  const locations = useGetLocations();
  const selectedLocation = locations?.find(
    (location: Location) => location._id === selectedLocationId
  );
  return {
    selectedLocation,
    locations,
  };
}
