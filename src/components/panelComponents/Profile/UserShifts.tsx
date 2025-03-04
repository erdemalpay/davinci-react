import Loading from "../../../components/common/Loading";
import { useGetStoreLocations } from "../../../utils/api/location";
import LocationShift from "./LocationShift";

const UserShifts = () => {
  const locations = useGetStoreLocations();
  if (!locations) return <Loading />;

  return (
    <div className="w-[95%] my-5 mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
      {locations?.map((location) => {
        return (
          <LocationShift key={location._id} shiftLocation={location._id} />
        );
      })}
    </div>
  );
};

export default UserShifts;
