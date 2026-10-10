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
  CreateBreakDto,
  Shift,
} from "../../types";
import {
  useBreakMutations,
  useGetBreaksByLocation,
} from "../../utils/api/break";
import { useGetMiddlemanByLocation } from "../../utils/api/middleman";
import { useGetShifts } from "../../utils/api/shift";
import { getItem, getRefId } from "../../utils/getItem";
import { getBreakWarning } from "./breakWarning";

interface BreakButtonProps {
  onBreakStart?: () => void;
}

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

  // People outside operation today don't count for the break warning.
  const todayDate = format(new Date(), "yyyy-MM-dd");
  const todayShifts = useGetShifts(
    todayDate,
    todayDate,
    selectedLocationId
  ) as unknown as Shift[] | undefined;
  const outsideOperation = useMemo(
    () =>
      new Set(
        (todayShifts ?? []).flatMap((day) =>
          (day?.shifts ?? []).flatMap((s) => s.outsideOperationUsers ?? [])
        )
      ),
    [todayShifts]
  );

  const othersOnBreak = useMemo(() => {
    if (!activeBreaks || !user) return [];
    // Only real breaks count for the "others are on break" warning.
    return activeBreaks
      .filter(
        (b) =>
          !b.finishHour &&
          getRefId(b.user) !== user?._id &&
          breakTypeOf(b) === BreakTypeEnum.BREAK &&
          !outsideOperation.has(getRefId(b.user) as string)
      )
      .map((b) => getItem(getRefId(b.user), users)?.name ?? t("Someone"));
  }, [activeBreaks, user, users, t, outsideOperation]);

  // Everyone checked in here (the person asking included).
  const staffInCafeCount = useMemo(
    () =>
      new Set(
        visits
          .filter(
            (visit) =>
              !visit.finishHour &&
              visit.location === selectedLocationId &&
              !outsideOperation.has(visit.user)
          )
          .map((visit) => visit.user)
      ).size,
    [visits, selectedLocationId, outsideOperation]
  );
  const breakWarning = getBreakWarning(othersOnBreak.length, staffInCafeCount);

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

  const doStartBreak = (
    type = pendingBreak.type,
    note: string | undefined = pendingBreak.note
  ) => {
    if (!user?._id || !selectedLocationId) return;
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
    doStartBreak(type, note);
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

    const isCurrentUserMiddleman = activeMiddlemen?.some(
      (m) =>
        (typeof m.user === "string" ? m.user : m.user._id) === user._id &&
        !m.finishHour
    );
    if (isCurrentUserMiddleman) {
      toast.error(t("You cannot start a break while you are the middleman"));
      return;
    }

    setIsStateDialogOpen(true);
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
          text={
            breakWarning === "lowStaff"
              ? t(
                  "There aren't enough staff in the cafe right now ({{names}} on break). Do you still want to take a break?",
                  { names: othersOnBreak.join(", ") }
                )
              : t(
                  "{{names}} are currently on break. Do you still want to take a break?",
                  { names: othersOnBreak.join(", ") }
                )
          }
        />
      )}
      {isStateDialogOpen && (
        <BusyStateDialog
          onSelect={handleSelectState}
          onCancel={() => setIsStateDialogOpen(false)}
        />
      )}
      <div className="relative">
        <button
          onClick={isOnBreak ? handleEndBreak : handleStartBreak}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-white font-medium transition-all duration-200 hover:scale-105 ${
            isOnBreak
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
          title={
            isOnBreak
              ? `${t(busyStateLabels[currentType])} - ${t("End")}`
              : t("Busy")
          }
        >
          <MdFreeBreakfast className="text-lg" />
          <span className="hidden sm:inline">
            {isOnBreak ? t("End") : t("Busy")}
          </span>
        </button>
      </div>
    </>
  );
};
