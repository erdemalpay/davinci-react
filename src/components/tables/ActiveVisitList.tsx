import { Chip, Tooltip } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { useLocationContext } from "../../context/Location.context";
import { User, Visit } from "../../types";
import { useGetUsers } from "../../utils/api/user";
import {
  useCreateVisitMutation,
  useFinishVisitMutation,
} from "../../utils/api/visit";
import { getItem } from "../../utils/getItem";
import { Autocomplete } from "../common/Autocomplete";
import { InputWithLabelProps } from "../common/InputWithLabel";
interface ActiveMentorListProps extends InputWithLabelProps {
  suggestions: User[];
  visits: Visit[];
}
interface SeenUsers {
  [key: string]: boolean;
}

export function ActiveVisitList({
  name,
  label,
  suggestions,
  visits,
}: ActiveMentorListProps) {
  const { mutate: createVisit } = useCreateVisitMutation();
  const { mutate: finishVisit } = useFinishVisitMutation();
  const users = useGetUsers();
  const { selectedLocationId } = useLocationContext();

  const [filteredSuggestions, setFilteredSuggestions] = useState<User[]>([]);

  function handleChipClose(userId: string) {
    if (!isUserActive(userId)) {
      return;
    }
    const visit = visits.find(
      (visitItem) => visitItem.user === userId && !visitItem?.finishHour
    );
    if (visit) finishVisit({ id: visit._id });
    // setItems(items.filter((t) => t._id !== user._id));
  }

  function handleSelection(item: User) {
    if (!item || isUserActive(item._id)) return;
    createVisit({
      location: selectedLocationId,
    });
    // setItems([...items, item]);
  }
  const isUserActive = (userId: string) => {
    return visits
      .filter((visit) => visit.user === userId)
      .some((visit) => !visit?.finishHour);
  };
  useEffect(() => {
    setFilteredSuggestions(
      suggestions.filter(
        (s) =>
          !visits
            .map((visit) => !visit.finishHour && visit.user)
            .includes(s._id) && s.name !== "-"
      )
    );
  }, [suggestions, visits]);

  const uniqueVisits = visits.reduce(
    (acc: { unique: typeof visits; seenUsers: SeenUsers }, visit) => {
      acc.seenUsers = acc.seenUsers || {}; // Initialize if not already initialized
      if (visit?.user && !acc.seenUsers[visit.user]) {
        acc.seenUsers[visit.user] = true; // Mark this user as seen
        acc.unique.push(visit);
      }
      return acc;
    },
    { unique: [], seenUsers: {} }
  ).unique;
  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col lg:flex-row w-full">
        <Autocomplete
          handleSelection={handleSelection}
          suggestions={filteredSuggestions}
          name={name}
          label={label}
        />
      </div>
      <div className="flex flex-wrap gap-2 mt-2 justify-start items-center ">
        {uniqueVisits.map((visit) => (
          <Tooltip
            key={visit?.user}
            content={getItem(visit?.user, users)?.role?.name}
          >
            <Chip
              value={getItem(visit?.user, users)?.name}
              style={{
                backgroundColor: isUserActive(visit.user)
                  ? getItem(visit?.user, users)?.role?.color
                  : "gray",
                height: "fit-content",
              }}
              color="gray"
              {...(isUserActive(visit.user)
                ? { onClose: () => handleChipClose(visit.user) }
                : {})}
            />
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
