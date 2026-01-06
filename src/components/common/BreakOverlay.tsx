import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdCoffee, MdStop, MdVisibilityOff } from "react-icons/md";
import { toast } from "react-toastify";
import { useUserContext } from "../../context/User.context";
import { Break } from "../../types";
import { useBreakMutations, useGetBreaksByDate } from "../../utils/api/break";

export const BreakOverlay = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const { updateBreak } = useBreakMutations();
  const [currentBreak, setCurrentBreak] = useState<Break | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isModalHidden, setIsModalHidden] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get active breaks for today's date
  const todayDate = format(new Date(), "yyyy-MM-dd");
  const activeBreaks = useGetBreaksByDate(todayDate);

  // Update current time every minute for real-time duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Find active break for current user
  useEffect(() => {
    if (activeBreaks && user) {
      const userActiveBreak = activeBreaks.find(
        (breakRecord) =>
          (typeof breakRecord.user === "string"
            ? breakRecord.user
            : breakRecord.user._id) === user._id && !breakRecord.finishHour
      );

      setCurrentBreak(userActiveBreak || null);
    }
  }, [activeBreaks, user]);

  // Cleanup: Reset states when break ends
  useEffect(() => {
    if (!currentBreak) {
      setIsModalHidden(false);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [currentBreak]);

  const handleHideModal = () => {
    setIsModalHidden(true);
    // Auto-show modal after 1 minute
    hideTimeoutRef.current = setTimeout(() => {
      setIsModalHidden(false);
    }, 60000);
  };

  const handleShowModal = () => {
    setIsModalHidden(false);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

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

    const today = format(new Date(), "yyyy-MM-dd");
    const startTime = new Date(`${today}T${currentBreak.startHour}:00`);

    const diffMs = currentTime.getTime() - startTime.getTime();
    const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

    return diffMinutes.toString();
  };

  // No active break - don't render anything
  if (!currentBreak) {
    return null;
  }

  // Modal hidden - show status bar (compact version)
  if (isModalHidden) {
    return (
      <div
        onClick={handleShowModal}
        className="fixed top-16 left-0 right-0 z-40 cursor-pointer"
      >
        <div className="bg-gradient-to-r from-orange-500 to-red-500 animate-pulse shadow-sm">
          <div className="px-4 py-1">
            <div className="flex items-center justify-center gap-2">
              <MdCoffee className="text-white text-sm" />
              <span className="text-white text-sm font-medium">
                {t("You're on a break")} - {getBreakDuration()} {t("minutes")}
              </span>
              <span className="text-white/70 text-xs">
                ({t("Click to open")})
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modal visible - show full overlay
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

        <div className="flex gap-3">
          <button
            onClick={handleHideModal}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-colors duration-200 text-lg flex items-center justify-center gap-2"
          >
            <MdVisibilityOff className="text-xl" />
            {t("Hide")}
          </button>
          <button
            onClick={handleEndBreak}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 text-lg"
          >
            {t("End")}
          </button>
        </div>

      </div>
    </div>
  );
};
