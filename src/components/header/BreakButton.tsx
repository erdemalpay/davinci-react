import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdFreeBreakfast } from "react-icons/md";
import { toast } from "react-toastify";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import { useDataContext } from "../../context/Data.context";
import { useLocationContext } from "../../context/Location.context";
import { useUserContext } from "../../context/User.context";
import { CreateBreakDto } from "../../types";
import {
  useBreakMutations,
  useGetBreaksByLocation,
} from "../../utils/api/break";
import { useGetMiddlemanByLocation } from "../../utils/api/middleman";
import { getItem, getRefId } from "../../utils/getItem";

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
  const [isBreakWarningOpen, setIsBreakWarningOpen] = useState(false);

  // Get active breaks for current location
  const activeBreaks = useGetBreaksByLocation(selectedLocationId || 0);

  // Get active middlemen for current location
  const activeMiddlemen = useGetMiddlemanByLocation(selectedLocationId || 0);

  const othersOnBreak = useMemo(() => {
    if (!activeBreaks || !user) return [];
    return activeBreaks
      .filter((b) => !b.finishHour && getRefId(b.user) !== user?._id)
      .map((b) => getItem(getRefId(b.user), users)?.name ?? t("Someone"));
  }, [activeBreaks, user, users, t]);

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
    } else {
      setIsOnBreak(false);
      setCurrentBreakId(null);
    }
  }, [activeBreaks, user, selectedLocationId]);

  const doStartBreak = () => {
    if (!user?._id || !selectedLocationId) return;
    const breakData: CreateBreakDto = {
      user: user._id,
      location: selectedLocationId,
      date: format(new Date(), "yyyy-MM-dd"),
      startHour: format(new Date(), "HH:mm"),
    };
    createBreak(breakData);
    toast.success(t("Break started"));
    onBreakStart?.();
    setIsBreakWarningOpen(false);
  };

  const handleStartBreak = () => {
    if (!user || !selectedLocationId) {
      toast.error(t("Please select a location first"));
      return;
    }

    if (isOnBreak) {
      toast.warning(t("You are already on a break"));
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

    if (othersOnBreak.length >= 2) {
      setIsBreakWarningOpen(true);
      return;
    }

    doStartBreak();
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
    toast.success(t("Break ended"));
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
          confirm={doStartBreak}
          title={t("Break Warning")}
          text={t(
            "{{names}} are currently on break. Do you still want to take a break?",
            { names: othersOnBreak.join(", ") }
          )}
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
          title={isOnBreak ? t("End Break") : t("Start Break")}
        >
          <MdFreeBreakfast className="text-lg" />
          <span className="hidden sm:inline">
            {isOnBreak ? t("End Break") : t("Start Break")}
          </span>
        </button>
      </div>
    </>
  );
};
