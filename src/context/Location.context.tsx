import { createContext, PropsWithChildren, useContext, useState } from "react";
import { Location } from "../types";
import { useGetLocations } from "../utils/api/location";

interface LocationContextType {
  selectedLocationId: number;
  setSelectedLocationId: (locationId: number) => void;
  locations: Location[];
}

const LocationContext = createContext<LocationContextType>({
  setSelectedLocationId: () => {},
  selectedLocationId: 1,
  locations: [],
});

export const LocationContextProvider = ({ children }: PropsWithChildren) => {
  const [selectedLocationId, setSelectedLocationId] = useState(1);
  const locations = useGetLocations();

  return (
    <LocationContext.Provider
      value={{
        selectedLocationId,
        setSelectedLocationId,
        locations,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => useContext(LocationContext);
