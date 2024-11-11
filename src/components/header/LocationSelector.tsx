import { useEffect, useState } from "react";
import { useLocationContext } from "../../context/Location.context";
import { Location } from "../../types";
import { useGetLocations } from "../../utils/api/location";

interface Props {
  allowedLocations?: number[];
}
export function LocationSelector({ allowedLocations }: Props) {
  const { selectedLocationId } = useLocationContext();
  const { setSelectedLocationId } = useLocationContext();
  const locations = useGetLocations();
  const [showedLocations, setShowedLocations] = useState<Location[]>([]);

  useEffect(() => {
    if (allowedLocations) {
      setShowedLocations(
        locations?.filter((location) => allowedLocations.includes(location._id))
      );
    } else {
      setShowedLocations(locations);
    }
    if (allowedLocations?.length === 1) {
      setSelectedLocationId(allowedLocations[0]);
    }
  }, [locations, allowedLocations]);

  return (
    <>
      {showedLocations?.map((location) => (
        <button
          key={location._id}
          onClick={() => setSelectedLocationId(location._id)}
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
