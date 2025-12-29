import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdStop } from "react-icons/md";
import { toast } from "react-toastify";
import { useLocationContext } from "../../context/Location.context";
import { useUserContext } from "../../context/User.context";
import { Break } from "../../types";
import {
  useBreakMutations,
  useGetBreaksByLocation,
} from "../../utils/api/break";

export const BreakOverlay = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const { selectedLocationId } = useLocationContext();
  const { updateBreak } = useBreakMutations();
  const [currentBreak, setCurrentBreak] = useState<Break | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get active breaks for current location
  const activeBreaks = useGetBreaksByLocation(selectedLocationId || 0);

  // Update current time every minute for real-time duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeBreaks && user && selectedLocationId) {
      // Find if current user has an active break
      const userActiveBreak = activeBreaks.find(
        (breakRecord) =>
          (typeof breakRecord.user === "string"
            ? breakRecord.user
            : breakRecord.user._id) === user._id && !breakRecord.finishHour
      );

      setCurrentBreak(userActiveBreak || null);
    }
  }, [activeBreaks, user, selectedLocationId]);

  const handleEndBreak = () => {
    if (!currentBreak) return;

    const finishHour = format(new Date(), "HH:mm");
    updateBreak({
      id: currentBreak._id.toString(),
      updates: { finishHour },
    });
    toast.success(t("Break ended"));
  };

  const getBreakDuration = () => {
    if (!currentBreak || !currentBreak.startHour) return "0";

    const [startHour, startMinute] = currentBreak.startHour
      .split(":")
      .map(Number);

    // Create start time using today's date
    const today = format(new Date(), "yyyy-MM-dd");
    const startTime = new Date(`${today}T${currentBreak.startHour}:00`);

    const diffMs = currentTime.getTime() - startTime.getTime();
    const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

    return diffMinutes.toString();
  };

  // Only show overlay if user has an active break
  if (!currentBreak) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 max-w-md w-[90%] mx-4 text-center shadow-2xl">
        <div className="mb-6">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdStop className="text-4xl text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {t("You're on a break")}
          </h2>
          <p className="text-gray-600">
            {t("Started at")} {currentBreak.startHour}
          </p>
        </div>

        <div className="mb-6">
          <div className="text-4xl font-bold text-orange-600 mb-2">
            {getBreakDuration()}
          </div>
          <p className="text-gray-500">{t("minutes")}</p>
        </div>

        <button
          onClick={handleEndBreak}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 text-lg"
        >
          {t("End Break")}
        </button>

        <p className="text-xs text-gray-400 mt-4">
          {t("Click the button above to end your break")}
        </p>
      </div>
    </div>
  );
};
