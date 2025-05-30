import { Chip, Tooltip } from "@material-tailwind/react";
import { useTranslation } from "react-i18next";
import { useDateContext } from "../../context/Date.context";
import { useLocationContext } from "../../context/Location.context";
import { Visit } from "../../types";
import { useGetShifts } from "../../utils/api/shift";
import { useGetUsers } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";

type Props = {
  visits: Visit[];
};

interface SeenUsers {
  [key: string]: boolean;
}
const ShiftList = ({ visits }: Props) => {
  const { t } = useTranslation();
  const { selectedDate } = useDateContext();
  const { selectedLocationId } = useLocationContext();
  const users = useGetUsers();
  const shifts = useGetShifts(selectedDate, selectedDate, selectedLocationId);
  const uniqueVisits = visits?.reduce(
    (acc: { unique: typeof visits; seenUsers: SeenUsers }, visit) => {
      acc.seenUsers = acc.seenUsers || {};
      if (visit?.user && !acc.seenUsers[visit.user]) {
        acc.seenUsers[visit.user] = true;
        acc.unique.push(visit);
      }
      return acc;
    },
    { unique: [], seenUsers: {} }
  ).unique;
  const visitedUsers = new Set<string>(uniqueVisits?.map((v) => v.user));
  const allShiftUsers = shifts?.reduce((acc, shift) => {
    shift?.shifts?.forEach(({ user: shiftUserArray }) => {
      shiftUserArray?.forEach((u) => acc.add(u));
    });
    return acc;
  }, new Set<string>());
  const missingUsers = Array?.from(allShiftUsers)?.filter(
    (u) => !visitedUsers.has(u)
  );
  if (missingUsers?.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-row gap-2 items-center">
      <h1 className="text-gray-500 text-sm">{t("Who will come?")}</h1>
      <div className="flex flex-wrap gap-2 mt-2 justify-start items-center ">
        {missingUsers.map((userId) => {
          const foundUser = getItem(userId, users);
          return (
            <Tooltip key={userId} content={foundUser?.role?.name}>
              <Chip
                value={foundUser?.name}
                style={{
                  backgroundColor: "green",
                  height: "fit-content",
                }}
                color="gray"
              />
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

export default ShiftList;
