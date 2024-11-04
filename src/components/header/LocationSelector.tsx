import { useLocationContext } from "../../context/Location.context";

interface Props {
  allowedLocations?: number[];
}
export function LocationSelector({ allowedLocations }: Props) {
  const { selectedLocationId } = useLocationContext();
  const { locations, setSelectedLocationId } = useLocationContext();

  if (!locations) return null;
  const selectedLocation = locations?.find(
    (location) => location._id === selectedLocationId
  );
  const showedLocations = allowedLocations
    ? locations?.filter((location) => allowedLocations.includes(location._id))
    : locations;
  if (showedLocations.length === 1) {
    setSelectedLocationId(showedLocations[0]._id);
  }
  return (
    <>
      {showedLocations?.map((location) => (
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
