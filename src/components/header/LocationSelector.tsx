import { useEffect, useState } from "react";
import { useLocationContext } from "../../context/Location.context";
import { Location } from "../../types";

interface Props {
  allowedLocations?: number[];
}
export function LocationSelector({ allowedLocations }: Props) {
  const { selectedLocationId, setSelectedLocationId, locations } =
    useLocationContext();
  const [showedLocations, setShowedLocations] = useState<Location[]>([]);

  useEffect(() => {
    if (allowedLocations) {
      setShowedLocations(
        locations?.filter((location) => allowedLocations.includes(location._id))
      );
    } else {
      setShowedLocations(locations);
    }
  }, [locations, allowedLocations]);

  useEffect(() => {
    if (
      allowedLocations?.length === 1 &&
      selectedLocationId !== allowedLocations[0]
    ) {
      setSelectedLocationId(allowedLocations[0]);
    }
  }, [allowedLocations, selectedLocationId, setSelectedLocationId]);

  return (
    <select
      value={selectedLocationId}
      onChange={(e) => {
        setSelectedLocationId(Number(e.target.value));
        window.scrollTo({ top: 0, behavior: "auto" });
      }}
      className="text-sm px-2 py-1 rounded-lg text-white bg-transparent border border-white/30"
    >
      {showedLocations?.map((location) => (
        <option
          key={location._id}
          value={location._id}
          className="text-gray-900 bg-white"
        >
          {location.name}
        </option>
      ))}
    </select>
  );
}
