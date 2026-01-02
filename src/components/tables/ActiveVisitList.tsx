import { Chip, Tooltip } from "@material-tailwind/react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDataContext } from "../../context/Data.context";
import { useLocationContext } from "../../context/Location.context";
import { useUserContext } from "../../context/User.context";
import { Break, RoleEnum, Visit, VisitSource } from "../../types";
import { useGetPanelSettings } from "../../utils/api/panelControl/panelSettings";
import { MinimalUser } from "../../utils/api/user";
import {
  useCreateVisitMutation,
  useFinishVisitMutation,
} from "../../utils/api/visit";
import { getItem } from "../../utils/getItem";
import { Autocomplete } from "../common/Autocomplete";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import { InputWithLabelProps } from "../common/InputWithLabel";

interface ActiveMentorListProps extends InputWithLabelProps {
  suggestions: MinimalUser[];
  visits: Visit[];
  breaks?: Break[];
}
interface SeenUsers {
  [key: string]: boolean;
}

export function ActiveVisitList({
  name,
  label,
  suggestions,
  visits,
  breaks = [],
}: ActiveMentorListProps) {
  const { t } = useTranslation();
  const { mutate: createVisit } = useCreateVisitMutation();
  const { mutate: finishVisit } = useFinishVisitMutation();
  const { users = [] } = useDataContext();
  const { user } = useUserContext();
  const panelSettings = useGetPanelSettings();
  const { selectedLocationId } = useLocationContext();
  const isDisabledCondition =
    panelSettings?.isVisitEntryDisabled && user?.role?._id !== RoleEnum.MANAGER;
  const [filteredSuggestions, setFilteredSuggestions] = useState<MinimalUser[]>(
    []
  );
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
    useState(false);
  const [closedVisitId, setClosedVisitId] = useState<number | null>(null);
  const [closedVisitFinishHour, setClosedVisitFinishHour] =
    useState<string>("");
  function handleChipClose(userId: string) {
    if (!isUserActive(userId)) {
      return;
    }
    const visit = visits.find(
      (visitItem) => visitItem.user === userId && !visitItem?.finishHour
    );
    if (visit) {
      const now = new Date();
      const finishHour = format(now, "HH:mm");
      setClosedVisitId(visit._id);
      setClosedVisitFinishHour(finishHour);
      setIsConfirmationDialogOpen(true);
    }

    // setItems(items.filter((t) => t._id !== user._id));
  }

  function handleSelection(item: MinimalUser) {
    if (isDisabledCondition) {
      return;
    }
    const now = new Date();
    const startHour = format(now, "HH:mm");
    const date = format(now, "yyyy-MM-dd");
    if (!item || isUserActive(item._id)) return;
    createVisit({
      location: selectedLocationId,
      date,
      startHour,
      visitStartSource: VisitSource.PANEL,
    });
    // setItems([...items, item]);
  }
  const isUserActive = (userId: string) => {
    return visits
      .filter((visit) => visit.user === userId)
      .some((visit) => !visit?.finishHour);
  };

  const isUserOnBreak = (userId: string) => {
    if (!breaks || breaks.length === 0) return null;
    return breaks.find(
      (breakItem) =>
        (typeof breakItem.user === "string"
          ? breakItem.user
          : breakItem.user._id) === userId &&
        breakItem.location === selectedLocationId &&
        !breakItem.finishHour
    );
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
  if (isConfirmationDialogOpen) {
    return (
      <ConfirmationDialog
        isOpen={isConfirmationDialogOpen}
        close={() => setIsConfirmationDialogOpen(false)}
        confirm={() => {
          if (!closedVisitId) return;
          finishVisit({
            id: closedVisitId,
            finishHour: closedVisitFinishHour,
            visitFinishSource: VisitSource.PANEL,
          });
          setIsConfirmationDialogOpen(false);
        }}
        title={t("Close Visit")}
        text={`${t("Are you sure you want to close this visit?")}`}
      />
    );
  }
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
        {uniqueVisits.map((visit) => {
          const userOnVisit = getItem(visit?.user, users);
          if (!userOnVisit) {
            return null;
          }

          const userBreak = isUserOnBreak(visit.user);
          const userName = userOnVisit.name ?? "";
          const userRole = userOnVisit.role?.name ?? "";

          const tooltipContent = userBreak
            ? `${userRole}  •  ${t("On Break")}`
            : userRole;

          return (
            <Tooltip key={visit?.user} content={tooltipContent}>
              <div className={userBreak ? "animate-pulse-dark" : ""}>
                <Chip
                  value={userName}
                  style={{
                    backgroundColor: isUserActive(visit.user)
                      ? userOnVisit.role?.color
                      : "gray",
                    height: "fit-content"
                  }}
                  color="gray"
                  {...(!isDisabledCondition &&
                  isUserActive(visit.user) &&
                  visit.user === user?._id
                    ? { onClose: () => handleChipClose(visit.user) }
                    : {})}
                />
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
