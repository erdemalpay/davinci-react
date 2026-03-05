import { useEffect, useState } from "react";
import { useLocationContext } from "../../context/Location.context";
import useIsSmallScreen from "../../hooks/useIsSmallScreen";
import { Location } from "../../types";

interface Props {
  allowedLocations?: number[];
}
export function LocationSelector({ allowedLocations }: Props) {
  const { selectedLocationId, setSelectedLocationId, locations } =
    useLocationContext();
  const [showedLocations, setShowedLocations] = useState<Location[]>([]);
  const isSmallScreen = useIsSmallScreen();

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

  if (isSmallScreen) {
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

  return (
    <>
      {showedLocations?.map((location) => (
        <button
          key={location._id}
          onClick={() => {
            setSelectedLocationId(location._id);
            window.scrollTo({ top: 0, behavior: "auto" });
          }}
          className={`text-sm ${
            selectedLocationId === location._id ? "border-2" : "border-0"
          }  px-2 py-1 rounded-lg  text-white`}
        >
          {location.name}
        </button>
      ))}
    </>
  );
}
