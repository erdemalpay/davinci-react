/*
  Over time there may be more useful event item components that can be included
  in the library
*/
import { Visit } from "../../types";
import { useGetUsers } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";

type Props = {
  visit: Visit;
  index: number;
};
const getIndexBackgroundColor = (index: number) => {
  const colors = [
    "bg-blue-300",
    "bg-green-300",
    "bg-red-300",
    "bg-orange-300",
    "bg-indigo-300",
    "bg-pink-300",
    "bg-purple-300",
    "bg-teal-300",
    "bg-cyan-300",
    "bg-lime-300",
    "bg-amber-300",
    "bg-gray-300",
    "bg-brown-300",
    "bg-blueGray-300",
  ];

  // If the index exceeds the number of colors, loop back to the beginning
  const colorIndex = index % colors.length;

  return colors[colorIndex];
};
export const VisitEventItem = ({ visit, index }: Props) => {
  const users = useGetUsers();
  if (!users) return <></>;
  return (
    <li className="py-1">
      <div className="flex text-sm flex-1 justify-between gap-1 ">
        <h3
          className={`font-medium ${getIndexBackgroundColor(
            index
          )} px-2 py-[1.4px] text-white rounded-lg`}
        >
          {getItem(visit?.user, users)?.name}
        </h3>
        <div className="flex gap-2 text-gray-500">
          <p>{visit.startHour}</p>
          {visit.finishHour && <p>- {visit.finishHour}</p>}
        </div>
      </div>
    </li>
  );
};
