import { createContext, PropsWithChildren, useContext, useState } from "react";
import { Location } from "../types";
import { useGetStoreLocations } from "../utils/api/location";

const LOCATION_LOCAL_STORAGE_KEY = "dvp.locationId";

interface LocationContextType {
  selectedLocationId: number | null;
  setSelectedLocationId: (locationId: number | null) => void;
  locations: Location[];
}

const LocationContext = createContext<LocationContextType>({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setSelectedLocationId: () => {},
  selectedLocationId: 1,
  locations: [],
});

export const LocationContextProvider = ({ children }: PropsWithChildren) => {
  const locationId = Number(localStorage.getItem(LOCATION_LOCAL_STORAGE_KEY));
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(locationId || 1);
  const locations = useGetStoreLocations();

  function selectLocation(locationId: number | null) {
    if (locationId !== null) {
      localStorage.setItem(LOCATION_LOCAL_STORAGE_KEY, locationId.toString());
    } else {
      localStorage.removeItem(LOCATION_LOCAL_STORAGE_KEY);
    }
    setSelectedLocationId(locationId);
  }

  return (
    <LocationContext.Provider
      value={{
        selectedLocationId,
        setSelectedLocationId: selectLocation,
        locations,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => useContext(LocationContext);
