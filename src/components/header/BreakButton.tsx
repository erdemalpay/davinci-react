import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdFreeBreakfast } from "react-icons/md";
import { toast } from "react-toastify";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import { BusyStateDialog } from "./BusyStateDialog";
import { useDataContext } from "../../context/Data.context";
import { useLocationContext } from "../../context/Location.context";
import { useUserContext } from "../../context/User.context";
import {
  BreakTypeEnum,
  breakTypeOf,
  busyStateLabels,
  isAssignedCallType,
  CreateBreakDto,
  DeclineReasonEnum,
  isBarista,
  RoleEnum,
  User,
} from "../../types";
import {
  useDeclineButtonCallMutation,
  useGetActiveButtonCalls,
} from "../../utils/api/buttonCall";
import {
  useBreakMutations,
  useGetBreaksByLocation,
} from "../../utils/api/break";
import { useGetGameplayTimesByDate } from "../../utils/api/gameplaytime";
import {
  useGetMiddlemanByLocation,
  useMiddlemanMutations,
} from "../../utils/api/middleman";
import {
  useGetUpstairsDuties,
  useTakeUpstairsDutyMutation,
} from "../../utils/api/upstairsDuty";
import { getItem, getRefId } from "../../utils/getItem";
import { useBreakWarning } from "../../hooks/useBreakWarning";

// Becoming busy while holding a call declines it with the same reason.
const declineReasonForBusyState: Record<BreakTypeEnum, DeclineReasonEnum> = {
  [BreakTypeEnum.BREAK]: DeclineReasonEnum.BREAK,
  [BreakTypeEnum.RECOMMENDING_GAME]: DeclineReasonEnum.RECOMMENDING_GAME,
  [BreakTypeEnum.PREPARING_ORDER]: DeclineReasonEnum.PREPARING_ORDER,
  [BreakTypeEnum.TAKING_PAYMENT]: DeclineReasonEnum.TAKING_PAYMENT,
  [BreakTypeEnum.WC]: DeclineReasonEnum.WC,
  [BreakTypeEnum.WAREHOUSE]: DeclineReasonEnum.WAREHOUSE,
  [BreakTypeEnum.BAR_CLEANING]: DeclineReasonEnum.BAR_CLEANING,
  [BreakTypeEnum.OTHER]: DeclineReasonEnum.OTHER,
};

interface BreakButtonProps {
  onBreakStart?: () => void;
}

// Nobody becomes the middleman from 22:00 until the cafe's night is over.
const isPastMiddlemanHours = (now: Date) =>
  now.getHours() >= 22 || now.getHours() < 6;

export const BreakButton = ({ onBreakStart }: BreakButtonProps) => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const { selectedLocationId } = useLocationContext();
  const { visits = [], users = [] } = useDataContext();
  const { createBreak, updateBreak } = useBreakMutations();
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [currentBreakId, setCurrentBreakId] = useState<number | null>(null);
  const [currentType, setCurrentType] = useState(BreakTypeEnum.BREAK);
  const [isBreakWarningOpen, setIsBreakWarningOpen] = useState(false);
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);

  // Get active breaks for current location
  const activeBreaks = useGetBreaksByLocation(selectedLocationId || 0);

  // Get active middlemen for current location
  const activeMiddlemen = useGetMiddlemanByLocation(selectedLocationId || 0);
  const { createMiddleman, updateMiddleman } = useMiddlemanMutations();
  const activeGameplayTimes = useGetGameplayTimesByDate(
    format(new Date(), "yyyy-MM-dd")
  );
  // Being the middleman is one of the busy states for game masters.
  const isGameRole =
    user?.role?._id === RoleEnum.GAMEMASTER ||
    user?.role?._id === RoleEnum.GAMEMANAGER;
  // A middleman away on a call has left the role free for anyone to take.
  const myMiddleman = activeMiddlemen?.find(
    (m) => getRefId(m.user) === user?._id && !m.finishHour && !m.awayOnCall
  );
  const otherMiddleman = activeMiddlemen?.find(
    (m) => getRefId(m.user) !== user?._id && !m.finishHour && !m.awayOnCall
  );
  const otherMiddlemanName =
    otherMiddleman &&
    (typeof otherMiddleman.user === "object"
      ? (otherMiddleman.user as User).name
      : t("Someone"));

  // Someone else's upstairs duty, which a game master can take over.
  const duties = useGetUpstairsDuties(
    selectedLocationId || 0,
    format(new Date(), "yyyy-MM-dd")
  );
  const otherDuty = duties?.find((d) => !d.finishHour && d.user !== user?._id);
  const { mutate: takeUpstairsDuty } = useTakeUpstairsDutyMutation();
  const handleTakeUpstairsDuty = () => {
    setIsStateDialogOpen(false);
    if (!selectedLocationId) return;
    takeUpstairsDuty(selectedLocationId);
  };

  const { warning: breakWarning, text: breakWarningText } = useBreakWarning();

  // A game master or service call assigned to me right now.
  const activeButtonCalls = useGetActiveButtonCalls();
  const myOpenCall = activeButtonCalls.find(
    (call) =>
      Number(call.location) === selectedLocationId &&
      call.assignedTo === user?._id &&
      !call.finishHour &&
      isAssignedCallType(call.type)
  );
  const { mutate: declineButtonCall } = useDeclineButtonCallMutation();

  // Check if current user has an active visit (is at the cafe)
  const hasActiveVisit = useMemo(() => {
    if (!user || !visits || visits.length === 0) return false;
    return visits.some((visit) => visit.user === user._id && !visit.finishHour);
  }, [visits, user]);

  useEffect(() => {
    if (activeBreaks && user && selectedLocationId) {
      // Find if current user has an active break
      const userActiveBreak = activeBreaks.find(
        (breakRecord) =>
          (typeof breakRecord.user === "string"
            ? breakRecord.user
            : breakRecord.user._id) === user._id && !breakRecord.finishHour
      );

      setIsOnBreak(!!userActiveBreak);
      setCurrentBreakId(userActiveBreak?._id || null);
      setCurrentType(breakTypeOf(userActiveBreak));
    } else {
      setIsOnBreak(false);
      setCurrentBreakId(null);
    }
  }, [activeBreaks, user, selectedLocationId]);

  const [pendingBreak, setPendingBreak] = useState<{
    type: BreakTypeEnum;
    note?: string;
  }>({ type: BreakTypeEnum.BREAK });

  // Called with the state just picked, or (after the break warning) with
  // the pending one. Only "Other" carries a note.
  const doStartBreak = ({
    type,
    note: pickedNote,
  }: {
    type: BreakTypeEnum;
    note?: string;
  } = pendingBreak) => {
    const note = type === BreakTypeEnum.OTHER ? pickedNote : undefined;
    if (!user?._id || !selectedLocationId) return;
    // Holding a call: hand it back with this reason; the API puts me in
    // the busy state and gives the call to someone else.
    if (myOpenCall) {
      declineButtonCall({
        id: myOpenCall._id,
        reason: declineReasonForBusyState[type],
        ...(note && { note }),
      });
      toast.success(
        type === BreakTypeEnum.BREAK
          ? t("Break started")
          : t(busyStateLabels[type])
      );
      onBreakStart?.();
      setIsBreakWarningOpen(false);
      return;
    }
    const breakData: CreateBreakDto = {
      user: user._id,
      location: selectedLocationId,
      date: format(new Date(), "yyyy-MM-dd"),
      startHour: format(new Date(), "HH:mm"),
      type,
      ...(note && { note }),
    };
    createBreak(breakData);
    toast.success(
      type === BreakTypeEnum.BREAK
        ? t("Break started")
        : t(busyStateLabels[type])
    );
    onBreakStart?.();
    setIsBreakWarningOpen(false);
  };

  // A state was picked in the "Busy" dialog.
  const handleSelectState = (type: BreakTypeEnum, note?: string) => {
    setIsStateDialogOpen(false);
    setPendingBreak({ type, note });
    // The "others are on break" warning is only about real breaks.
    if (type === BreakTypeEnum.BREAK && breakWarning) {
      setIsBreakWarningOpen(true);
      return;
    }
    doStartBreak({ type, note });
  };

  const handleStartBreak = () => {
    if (!user || !selectedLocationId) {
      toast.error(t("Please select a location first"));
      return;
    }

    if (isOnBreak) {
      toast.warning(t("You are already busy"));
      return;
    }

    setIsStateDialogOpen(true);
  };

  const handleStartMiddleman = () => {
    setIsStateDialogOpen(false);
    if (!user || !selectedLocationId) return;
    const isExplaining = activeGameplayTimes?.some(
      (g) =>
        getRefId(g.user) === user._id &&
        (typeof g.location === "number" ? g.location : g.location._id) ===
          selectedLocationId &&
        !g.finishHour
    );
    if (isExplaining) {
      toast.error(
        t("You cannot be a middleman while you are in a gameplay session")
      );
      return;
    }
    createMiddleman({
      user: user._id,
      location: selectedLocationId,
      date: format(new Date(), "yyyy-MM-dd"),
      startHour: format(new Date(), "HH:mm"),
    });
    toast.success(t("Middleman started"));
  };

  const handleEndMiddleman = () => {
    if (!myMiddleman) return;
    updateMiddleman({
      id: myMiddleman._id,
      updates: { finishHour: format(new Date(), "HH:mm") },
    });
    toast.success(t("Middleman ended"));
  };

  const handleEndBreak = () => {
    if (!currentBreakId) {
      toast.error(t("No active break found"));
      return;
    }

    // End break by setting finishHour
    updateBreak({
      id: currentBreakId,
      updates: {
        finishHour: format(new Date(), "HH:mm"),
      },
    });
    toast.success(
      currentType === BreakTypeEnum.BREAK
        ? t("Break ended")
        : t("You are available again")
    );
  };

  // Don't show break button if user doesn't have an active visit (not at the cafe)
  if (!hasActiveVisit) {
    return null;
  }

  return (
    <>
      {isBreakWarningOpen && (
        <ConfirmationDialog
          isOpen={isBreakWarningOpen}
          close={() => setIsBreakWarningOpen(false)}
          confirm={() => doStartBreak()}
          title={t("Break Warning")}
          text={breakWarningText}
        />
      )}
      {isStateDialogOpen && (
        <BusyStateDialog
          onSelect={handleSelectState}
          onCancel={() => setIsStateDialogOpen(false)}
          isBarista={isBarista(user?.role?._id)}
          middleman={
            isGameRole && !isPastMiddlemanHours(new Date())
              ? {
                  onSelect: handleStartMiddleman,
                  takenBy: otherMiddlemanName || undefined,
                }
              : undefined
          }
          upstairsDuty={
            isGameRole && otherDuty && !myMiddleman
              ? {
                  onSelect: handleTakeUpstairsDuty,
                  heldBy:
                    getItem(otherDuty.user, users)?.name ?? otherDuty.user,
                }
              : undefined
          }
        />
      )}
      <div className="relative">
        <button
          onClick={
            myMiddleman
              ? handleEndMiddleman
              : isOnBreak
              ? handleEndBreak
              : handleStartBreak
          }
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-white font-medium transition-all duration-200 hover:scale-105 ${
            isOnBreak || myMiddleman
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
          title={
            myMiddleman
              ? t("End Middleman")
              : isOnBreak
              ? `${t(busyStateLabels[currentType])} - ${t("End")}`
              : t("Busy")
          }
        >
          <MdFreeBreakfast className="text-lg" />
          <span className="hidden sm:inline">
            {isOnBreak || myMiddleman ? t("End") : t("Busy")}
          </span>
        </button>
      </div>
    </>
  );
};
