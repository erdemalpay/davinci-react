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

  function handleChipClose(visit: Visit) {
    finishVisit({ id: visit._id });
    // setItems(items.filter((t) => t._id !== user._id));
  }

  function handleSelection(item: User) {
    if (!item) return;
    createVisit({
      user: item as any,
      location: selectedLocationId,
    });
    // setItems([...items, item]);
  }

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
        {visits.map((visit) => (
          <Tooltip
            key={visit?.user}
            content={getItem(visit?.user, users)?.role?.name}
          >
            <Chip
              value={getItem(visit?.user, users)?.name}
              style={{
                backgroundColor: getItem(visit?.user, users)?.role?.color,
                height: "fit-content",
              }}
              color="gray"
              onClose={() => handleChipClose(visit)}
            />
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
