import { useContext } from "react";
import { LocationContext } from "../../context/LocationContext";

import { useGetLocations } from "../../utils/api/location";
import { useNavigate } from "react-router-dom";

export function LocationSelector() {
  const { selectedLocationId } = useContext(LocationContext);
  const locations = useGetLocations();
  const navigate = useNavigate();
  if (!locations) return null;
  const selectedLocation = locations?.find(
    (location) => location._id === selectedLocationId
  );
  return (
    <>
      {locations.map((location) => (
        <button
          key={location._id}
          onClick={() => {
            navigate(`/${location._id}`);
          }}
          className={`text-sm ${
            selectedLocation?._id === location._id ? "border-2" : "border-0"
          } rounded p-2 text-white`}
        >
          {location.name}
        </button>
      ))}
    </>
  );
}
