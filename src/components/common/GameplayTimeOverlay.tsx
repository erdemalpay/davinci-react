import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { GiPerspectiveDiceSixFacesRandom } from "react-icons/gi";
import { MdSportsEsports, MdVisibilityOff } from "react-icons/md";
import { toast } from "react-toastify";
import { useUserContext } from "../../context/User.context";
import { GameplayTime } from "../../types";
import { useGetGames } from "../../utils/api/game";
import {
  useGameplayTimeMutations,
  useGetGameplayTimesByDate,
} from "../../utils/api/gameplaytime";
import { useGetUsersMinimal } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";

export const GameplayTimeOverlay = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const { updateGameplayTime } = useGameplayTimeMutations();
  const [currentGameplayTime, setCurrentGameplayTime] =
    useState<GameplayTime | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isModalHidden, setIsModalHidden] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get active gameplay times for today's date
  const todayDate = format(new Date(), "yyyy-MM-dd");
  const activeGameplayTimes = useGetGameplayTimesByDate(todayDate);
  const games = useGetGames();
  const users = useGetUsersMinimal();

  // Update current time every minute for real-time duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeGameplayTimes && user) {
      // Find if current user has an active gameplay time for today
      const userActiveGameplayTime = activeGameplayTimes.find(
        (gameplayTime) =>
          (typeof gameplayTime.user === "string"
            ? gameplayTime.user
            : gameplayTime.user._id) === user._id && !gameplayTime.finishHour
      );

      setCurrentGameplayTime(userActiveGameplayTime || null);
    }
  }, [activeGameplayTimes, user]);

  // Cleanup: Reset states when gameplay ends
  useEffect(() => {
    if (!currentGameplayTime) {
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
  }, [currentGameplayTime]);

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

  const handleEndGameplayTime = () => {
    if (!currentGameplayTime) return;

    const finishHour = format(new Date(), "HH:mm");
    updateGameplayTime({
      id: currentGameplayTime._id.toString(),
      updates: { finishHour },
    });
    toast.success(t("Gameplay time ended"));
  };

  const getGameplayDuration = () => {
    if (!currentGameplayTime || !currentGameplayTime.startHour) return "0";

    const [startHour, startMinute] = currentGameplayTime.startHour
      .split(":")
      .map(Number);

    // Create start time using today's date
    const today = format(new Date(), "yyyy-MM-dd");
    const startTime = new Date(`${today}T${currentGameplayTime.startHour}:00`);

    const diffMs = currentTime.getTime() - startTime.getTime();
    const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

    return diffMinutes.toString();
  };

  const getGameplayDetails = () => {
    if (!currentGameplayTime) return null;

    const gameplay =
      typeof currentGameplayTime.gameplay === "object"
        ? currentGameplayTime.gameplay
        : null;

    const mentor =
      gameplay && typeof gameplay.mentor === "object"
        ? gameplay.mentor
        : typeof gameplay?.mentor === "string"
        ? getItem(gameplay.mentor, users)
        : null;

    const game =
      gameplay && typeof gameplay.game === "object"
        ? gameplay.game
        : typeof gameplay?.game === "number"
        ? getItem(gameplay.game, games)
        : null;

    // Only return details if we have actual data
    if (!mentor?.name && !game?.name && !gameplay?.playerCount) {
      return null;
    }

    return {
      mentorName: mentor?.name,
      gameName: game?.name,
      playerCount: gameplay?.playerCount,
    };
  };

  // No active gameplay time - don't render anything
  if (!currentGameplayTime) {
    return null;
  }

  const details = getGameplayDetails();

  // Modal hidden - show status bar (compact version)
  if (isModalHidden) {
    return (
      <div
        onClick={handleShowModal}
        className="fixed top-16 left-0 right-0 z-40 cursor-pointer"
      >
        <div className="bg-gradient-to-r from-purple-500 to-purple-700 animate-pulse shadow-sm">
          <div className="px-4 py-1">
            <div className="flex items-center justify-center gap-2">
              <GiPerspectiveDiceSixFacesRandom className="text-white text-sm" />
              <span className="text-white text-sm font-medium">
                {t("You're in a gameplay session")} - {getGameplayDuration()}{" "}
                {t("minutes")}
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
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdSportsEsports className="text-4xl text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {t("You're in a gameplay session")}
          </h2>
          <p className="text-gray-600">
            {t("Started at")} {currentGameplayTime.startHour}
          </p>
        </div>

        {details && (
          <div className="mb-6 bg-gray-50 rounded-lg p-4 space-y-2">
            {details.gameName && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t("Game")}:</span>
                <span className="font-semibold text-gray-800">
                  {details.gameName}
                </span>
              </div>
            )}
            {details.mentorName && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t("Mentor")}:</span>
                <span className="font-semibold text-gray-800">
                  {details.mentorName}
                </span>
              </div>
            )}
            {details.playerCount !== undefined && details.playerCount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t("Players")}:</span>
                <span className="font-semibold text-gray-800">
                  {details.playerCount}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mb-6">
          <div className="text-4xl font-bold text-purple-600 mb-2">
            {getGameplayDuration()}
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
            onClick={handleEndGameplayTime}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 text-lg"
          >
            {t("End")}
          </button>
        </div>

      </div>
    </div>
  );
};
