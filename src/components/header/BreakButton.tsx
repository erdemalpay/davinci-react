import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdFreeBreakfast } from "react-icons/md";
import { toast } from "react-toastify";
import { useLocationContext } from "../../context/Location.context";
import { useUserContext } from "../../context/User.context";
import {
  useBreakMutations,
  useGetBreaksByLocation,
} from "../../utils/api/break";
import { CreateBreakDto } from "../../types";

interface BreakButtonProps {
  onBreakStart?: () => void;
}

export const BreakButton = ({ onBreakStart }: BreakButtonProps) => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const { selectedLocationId } = useLocationContext();
  const { createBreak } = useBreakMutations();
  const [isOnBreak, setIsOnBreak] = useState(false);

  // Get active breaks for current location
  const activeBreaks = useGetBreaksByLocation(selectedLocationId || 0);

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
    const breakData : CreateBreakDto = {
      user: user._id,
      location: selectedLocationId,
      date: format(new Date(), "yyyy-MM-dd"),
      startHour: format(new Date(), "HH:mm"),
    };
    createBreak(breakData);
    toast.success(t("Break started"));
    onBreakStart?.();
  };

  // Don't show button if user is already on break
  if (isOnBreak) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={handleStartBreak}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-white font-medium transition-all duration-200 hover:scale-105 bg-green-600 hover:bg-green-700"
        title={t("Start Break")}
      >
        <MdFreeBreakfast className="text-lg" />
        <span className="hidden sm:inline">{t("Start Break")}</span>
      </button>
    </div>
  );
};
