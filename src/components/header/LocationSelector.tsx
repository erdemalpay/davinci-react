import { useLocationContext } from "../../context/Location.context";

export function LocationSelector() {
  const { selectedLocationId } = useLocationContext();
  const { locations, setSelectedLocationId } = useLocationContext();

  if (!locations) return null;
  const selectedLocation = locations?.find(
    (location) => location._id === selectedLocationId
  );
  return (
    <>
      {locations.map((location) => (
        <button
          key={location._id}
          onClick={() => setSelectedLocationId(location._id)}
          className={`text-sm ${
            selectedLocation?._id === location._id ? "border-2" : "border-0"
          }  px-2 py-1 rounded-lg  text-white`}
        >
          {location.name}
        </button>
      ))}
    </>
  );
}
