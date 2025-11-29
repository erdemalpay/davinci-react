import { Chip, Tooltip } from "@material-tailwind/react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocationContext } from "../../context/Location.context";
import { useUserContext } from "../../context/User.context";
import { RoleEnum, Visit, VisitSource } from "../../types";
import { useGetPanelSettings } from "../../utils/api/panelControl/panelSettings";
import { MinimalUser, useGetUsersMinimal } from "../../utils/api/user";
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
  const { t } = useTranslation();
  const { mutate: createVisit } = useCreateVisitMutation();
  const { mutate: finishVisit } = useFinishVisitMutation();
  const users = useGetUsersMinimal();
  const { user } = useUserContext();
  const panelSettings = useGetPanelSettings();
  const { selectedLocationId } = useLocationContext();
  const isDisabledCondition =
    panelSettings?.isVisitEntryDisabled && user?.role?._id !== RoleEnum.MANAGER;
  const [filteredSuggestions, setFilteredSuggestions] = useState<MinimalUser[]>([]);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
    useState(false);
  const [closedVisitId, setClosedVisitId] = useState<number | null>(null);
  const [closedVisitFinishHour, setClosedVisitFinishHour] = useState<string>("");
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
            visitFinishSource: VisitSource.PANEL
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
              {...(!isDisabledCondition && isUserActive(visit.user) && visit.user === user?._id
                ? { onClose: () => handleChipClose(visit.user) }
                : {})}
            />
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
