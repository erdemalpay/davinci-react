import { Chip, Tooltip } from "@material-tailwind/react";
import { useTranslation } from "react-i18next";
import { Visit } from "../../types";

interface PreviousVisitListProps {
  visits: Visit[];
}

export function PreviousVisitList({ visits }: PreviousVisitListProps) {
  const { t } = useTranslation();
  return visits?.length ? (
    <div className="flex flex-col lg:flex-row w-full gap-2">
      <label
        htmlFor="mentors"
        className="flex text-gray-800 dark:text-gray-100 text-sm items-center"
      >
        {t("Who was at cafe")}?
      </label>
      <div
        className="flex flex-wrap gap-2 mt-2 justify-center items-center"
        id="mentors"
      >
        {visits.map((visit) => (
          <Tooltip key={visit?.user?._id} content={visit.user?.role?.name}>
            <Chip
              value={visit.user.name}
              style={{
                backgroundColor: visit.user?.role?.color,
                height: "fit-content",
              }}
              color="gray"
            />
          </Tooltip>
        ))}
      </div>
    </div>
  ) : null;
}
