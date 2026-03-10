import { Checkbox, Chip, Tooltip } from "@material-tailwind/react";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BiCoffee } from "react-icons/bi";
import { GiPerspectiveDiceSixFacesRandom, GiRoundTable } from "react-icons/gi";
import { toast } from "react-toastify";
import { useDataContext } from "../../context/Data.context";
import { useLocationContext } from "../../context/Location.context";
import { useUserContext } from "../../context/User.context";
import {
  Break,
  GameplayTime,
  Middleman,
  RoleEnum,
  Table,
  Visit,
  VisitSource,
} from "../../types";
import { useGetGameplayTimesByDate } from "../../utils/api/gameplaytime";
import {
  useGetMiddlemanByDate,
  useMiddlemanMutations,
} from "../../utils/api/middleman";
import {
  useCreateVisitMutation,
  useFinishVisitMutation,
} from "../../utils/api/visit";
import { getItem, getRefId } from "../../utils/getItem";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import { InputWithLabelProps } from "../common/InputWithLabel";
import Loading from "../common/Loading";

interface ActiveMentorListProps extends InputWithLabelProps {
  visits: Visit[];
  breaks?: Break[];
  tables?: Table[];
}
interface SeenUsers {
  [key: string]: boolean;
}

export function ActiveVisitList({
  name,
  label,
  visits,
  breaks = [],
  tables = [],
}: ActiveMentorListProps) {
  const { t } = useTranslation();
  const { mutate: createVisit } = useCreateVisitMutation();
  const { mutate: finishVisit } = useFinishVisitMutation();
  const { users = [], panelSettings } = useDataContext();
  const { user } = useUserContext();
  const { selectedLocationId } = useLocationContext();
  const isDisabledCondition = panelSettings?.isVisitEntryDisabled;

  // Get active gameplay times and middleman sessions for today
  const todayDate = format(new Date(), "yyyy-MM-dd");
  const activeGameplayTimes = useGetGameplayTimesByDate(todayDate);
  const activeMiddlemen = useGetMiddlemanByDate(todayDate);
  const { updateMiddleman } = useMiddlemanMutations();
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
    useState(false);
  const [closedVisitId, setClosedVisitId] = useState<number | null>(null);
  const [closedVisitFinishHour, setClosedVisitFinishHour] =
    useState<string>("");
  const [isCreatingVisit, setIsCreatingVisit] = useState(false);
  const [middlemanToEnd, setMiddlemanToEnd] = useState<Middleman | null>(null);

  const canEndOthersMiddleman = useMemo(() => {
    if (!user) return false;
    return (
      user.role._id === RoleEnum.MANAGER ||
      user.role._id === RoleEnum.GAMEMANAGER
    );
  }, [user]);

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

  function handleCheckboxChange(checked: boolean) {
    if (isDisabledCondition) {
      return;
    }
    if (checked) {
      setIsCreatingVisit(true);

      const now = new Date();
      const startHour = format(now, "HH:mm");
      const date = format(now, "yyyy-MM-dd");
      createVisit(
        {
          location: selectedLocationId,
          date,
          startHour,
          visitStartSource: VisitSource.PANEL,
        },
        {
          onSuccess: () => {
            setIsCreatingVisit(false);
          },
          onError: () => {
            setIsCreatingVisit(false);
          },
        }
      );
    } else {
      // Uncheck: finish the visit
      if (user?._id) {
        const visit = visits.find(
          (visitItem) => visitItem.user === user._id && !visitItem?.finishHour
        );
        if (visit) {
          const now = new Date();
          const finishHour = format(now, "HH:mm");
          setClosedVisitId(visit._id);
          setClosedVisitFinishHour(finishHour);
          setIsConfirmationDialogOpen(true);
        }
      }
    }
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

  const isUserInGameplayTime = (userId: string): GameplayTime | null => {
    if (!activeGameplayTimes || activeGameplayTimes.length === 0) return null;
    return (
      activeGameplayTimes.find(
        (gameplayTime) =>
          (typeof gameplayTime.user === "string"
            ? gameplayTime.user
            : gameplayTime.user._id) === userId &&
          (typeof gameplayTime.location === "number"
            ? gameplayTime.location
            : gameplayTime.location._id) === selectedLocationId &&
          !gameplayTime.finishHour
      ) || null
    );
  };

  const isUserMiddleman = (userId: string): Middleman | null => {
    if (!activeMiddlemen || activeMiddlemen.length === 0) return null;
    return (
      activeMiddlemen.find(
        (m) =>
          getRefId(m.user) === userId &&
          m.location === selectedLocationId &&
          !m.finishHour
      ) || null
    );
  };
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

  const isCurrentUserCheckedIn = user?._id ? isUserActive(user._id) : false;

  const getVisitBadgePriority = (visit: Visit) => {
    const userBreak = isUserOnBreak(visit.user);
    const userInGameplayTime = isUserInGameplayTime(visit.user);
    const userMiddleman = isUserMiddleman(visit.user);
    const userActive = isUserActive(visit.user);

    if (userActive) {
      if (!userBreak && !userInGameplayTime && !userMiddleman) return 1;
      if (userInGameplayTime) return 2;
      if (userBreak) return 3;
      if (userMiddleman) return 4;
    }
    return 5;
  };

  const sortedVisits = useMemo(() => {
    return [...uniqueVisits].sort((a, b) => {
      return getVisitBadgePriority(a) - getVisitBadgePriority(b);
    });
  }, [uniqueVisits, breaks, activeGameplayTimes, activeMiddlemen]);

  if (middlemanToEnd) {
    const userRef = middlemanToEnd.user;
    const middlemanUserName =
      (typeof userRef === "object" &&
        userRef !== null &&
        "name" in userRef &&
        (userRef as { name?: string }).name) ||
      getItem(getRefId(userRef), users)?.name ||
      t("Someone");
    return (
      <ConfirmationDialog
        isOpen
        close={() => setMiddlemanToEnd(null)}
        confirm={() => {
          if (!middlemanToEnd) return;
          updateMiddleman({
            id: middlemanToEnd._id,
            updates: { finishHour: format(new Date(), "HH:mm") },
          });
          toast.success(t("Middleman ended"));
          setMiddlemanToEnd(null);
        }}
        title={t("End Middleman")}
        text={t("Do you want to end middleman session for {{name}}?", {
          name: middlemanUserName,
        })}
      />
    );
  }

  if (isConfirmationDialogOpen) {
    return (
      <ConfirmationDialog
        isOpen={isConfirmationDialogOpen}
        close={() => {
          setIsConfirmationDialogOpen(false);
        }}
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

  if (isCreatingVisit) {
    return <Loading />;
  }
  return (
    <div className="flex flex-col w-full">
      {!isDisabledCondition && (
        <div className="flex flex-row w-full items-center gap-3">
          <Checkbox
            checked={isCurrentUserCheckedIn}
            onChange={(e) => handleCheckboxChange(e.target.checked)}
            disabled={isDisabledCondition}
            label={label}
            className="hover:before:opacity-0"
            containerProps={{
              className: "p-0",
            }}
            labelProps={{
              className:
                "cursor-default select-none text-black font-normal ml-2",
            }}
            crossOrigin={undefined}
          />
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-2 justify-start items-center ">
        {sortedVisits.map((visit) => {
          const userOnVisit = getItem(visit?.user, users);
          if (!userOnVisit) {
            return null;
          }

          const userBreak = isUserOnBreak(visit.user);
          const userGameplayTime = isUserInGameplayTime(visit.user);
          const userMiddleman = isUserMiddleman(visit.user);
          const userName = userOnVisit.name ?? "";
          const userRole = userOnVisit.role?.name ?? "";

          // Build tooltip content based on user status
          let tooltipContent = userRole;
          if (userBreak) {
            tooltipContent = `${userRole}  •  ${t("On Break")}`;
          } else if (userGameplayTime) {
            const tableId = getRefId(userGameplayTime.table);
            const table = getItem(tableId, tables);
            const tableName = table?.name || `${t("Table")} ${tableId}`;
            tooltipContent = `${userRole}  •  ${t(
              "In Gameplay"
            )}  •  ${tableName}`;
          } else if (userMiddleman) {
            tooltipContent = `${userRole}  •  ${t("Middleman")}`;
          }

          const getChipValue = () => {
            if (userBreak) {
              return (
                <span className="flex items-center gap-1">
                  <BiCoffee className="text-sm" />
                  {userName}
                </span>
              );
            }
            if (userGameplayTime) {
              return (
                <span className="flex items-center gap-1">
                  <GiPerspectiveDiceSixFacesRandom className="text-sm" />
                  {userName}
                </span>
              );
            }
            if (userMiddleman) {
              return (
                <span className="flex items-center gap-1">
                  <GiRoundTable className="text-sm" />
                  {userName}
                </span>
              );
            }
            return userName;
          };

          const getChipBackgroundColor = () => {
            if (userGameplayTime) {
              return "#F97316";
            } else if (userBreak) {
              return "#255691";
            } else if (userMiddleman) {
              return "#0D9488";
            } else return "#288809";
          };

          const canClickToEndMiddleman =
            canEndOthersMiddleman &&
            !!userMiddleman &&
            visit.user !== user?._id;

          return (
            <Tooltip
              key={visit?.user}
              content={
                canClickToEndMiddleman
                  ? `${tooltipContent} — ${t("Click to end middleman")}`
                  : tooltipContent
              }
            >
              <div
                onClick={
                  canClickToEndMiddleman && userMiddleman
                    ? () => setMiddlemanToEnd(userMiddleman)
                    : undefined
                }
                className={
                  canClickToEndMiddleman ? "cursor-pointer" : undefined
                }
              >
                <Chip
                  value={getChipValue()}
                  style={{
                    backgroundColor: isUserActive(visit.user)
                      ? getChipBackgroundColor()
                      : "gray",
                    height: "fit-content",
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
