import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdFreeBreakfast } from "react-icons/md";
import { toast } from "react-toastify";
import { useDataContext } from "../../context/Data.context";
import { useLocationContext } from "../../context/Location.context";
import { useUserContext } from "../../context/User.context";
import { CreateBreakDto } from "../../types";
import {
  useBreakMutations,
  useGetBreaksByLocation,
} from "../../utils/api/break";

interface BreakButtonProps {
  onBreakStart?: () => void;
}

export const BreakButton = ({ onBreakStart }: BreakButtonProps) => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const { selectedLocationId } = useLocationContext();
  const { visits = [] } = useDataContext();
  const { createBreak, updateBreak } = useBreakMutations();
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [currentBreakId, setCurrentBreakId] = useState<number | null>(null);

  // Get active breaks for current location
  const activeBreaks = useGetBreaksByLocation(selectedLocationId || 0);

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

  const handleStartBreak = () => {
    if (!user || !selectedLocationId) {
      toast.error(t("Please select a location first"));
      return;
    }

    if (isOnBreak) {
      // User is already on break, don't start another one
      toast.warning(t("You are already on a break"));
      return;
    }

    // Start break
    const breakData: CreateBreakDto = {
      user: user._id,
      location: selectedLocationId,
      date: format(new Date(), "yyyy-MM-dd"),
      startHour: format(new Date(), "HH:mm"),
    };
    createBreak(breakData);
    toast.success(t("Break started"));
    onBreakStart?.();
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
  );
};
