/*
  Over time there may be more useful event item components that can be included
  in the library
*/

import { Visit } from "../../types";

type Props = {
  visit: Visit;
};

export const VisitEventItem = ({ visit }: Props) => {
  return (
    <li>
      <div className="flex text-sm flex-1 justify-between ">
        <h3 className="font-medium">{visit.user.name}</h3>
        <div className="flex gap-2 text-gray-500">
          <p>{visit.startHour}</p>
          {visit.finishHour && <p>- {visit.finishHour}</p>}
        </div>
      </div>
    </li>
  );
};
