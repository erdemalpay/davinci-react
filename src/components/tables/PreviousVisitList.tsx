import { InputWithLabelProps } from "../common/InputWithLabel";
import { Chip, Tooltip } from "@material-tailwind/react";
import { Visit } from "../../types";

interface PreviousVisitListProps {
  visits: Visit[];
}

export function PreviousVisitList({ visits }: PreviousVisitListProps) {
  return visits?.length ? (
    <div className="flex flex-col lg:flex-row w-full gap-2">
      <label
        htmlFor="mentors"
        className="flex text-gray-800 dark:text-gray-100 text-sm items-center"
      >
        {"Who was at cafe:"}
      </label>
      <div className="flex flex-wrap gap-4 mt-2" id="mentors">
        {visits.map((visit) => (
          <Tooltip key={visit?.user?._id} content={visit.user?.role?.name}>
            <Chip
              value={visit.user.name}
              style={{ backgroundColor: visit.user?.role?.color }}
              color="grey"
            />
          </Tooltip>
        ))}
      </div>
    </div>
  ) : null;
}
