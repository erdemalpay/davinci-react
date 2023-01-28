import { createContext } from "react";

type LocationContextType = {
  selectedLocationId: number;
  setSelectedLocationId: (locationId: number) => void;
};

export const LocationContext = createContext<LocationContextType>({
  setSelectedLocationId: () => {},
  selectedLocationId: 1,
});
