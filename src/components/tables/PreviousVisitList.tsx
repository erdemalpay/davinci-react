import { Chip, Tooltip } from "@material-tailwind/react";
import { useTranslation } from "react-i18next";
import { Visit } from "../../types";
import { useGetUsers } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";

interface PreviousVisitListProps {
  visits: Visit[];
}

export function PreviousVisitList({ visits }: PreviousVisitListProps) {
  const { t } = useTranslation();
  const users = useGetUsers();
  if (!users) return <></>;
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
          <Tooltip
            key={visit?.user}
            content={getItem(visit.user, users)?.role?.name}
          >
            <Chip
              value={getItem(visit.user, users)?.name}
              style={{
                backgroundColor: getItem(visit.user, users)?.role?.color,
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
