import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Cookies from "js-cookie";
import { useTranslation } from "react-i18next";
import { MdClose, MdCoffee, MdSportsEsports } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { useBreakMutations, useGetBreaksByDate } from "../../utils/api/break";
import {
  useGameplayTimeMutations,
  useGetGameplayTimesByDate,
} from "../../utils/api/gameplaytime";
import { clearLocalStoragePreservingOnboarding } from "../../utils/onboardingStorage";

export const LogoutConfirmationModal = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLogoutModalOpen, setIsLogoutModalOpen, setIsSidebarOpen } =
    useGeneralContext();
  const { user, setUser } = useUserContext();
  const { updateBreak } = useBreakMutations();
  const { updateGameplayTime } = useGameplayTimeMutations();

  const todayDate = format(new Date(), "yyyy-MM-dd");
  const activeBreaks = useGetBreaksByDate(todayDate);
  const activeGameplayTimes = useGetGameplayTimesByDate(todayDate);

  // Find user's active break
  const userActiveBreak = activeBreaks?.find(
    (breakRecord) =>
      (typeof breakRecord.user === "string"
        ? breakRecord.user
        : breakRecord.user._id) === user?._id && !breakRecord.finishHour
  );

  // Find user's active gameplay time
  const userActiveGameplayTime = activeGameplayTimes?.find(
    (gameplayTime) =>
      (typeof gameplayTime.user === "string"
        ? gameplayTime.user
        : gameplayTime.user._id) === user?._id && !gameplayTime.finishHour
  );

  const hasActiveSession = userActiveBreak || userActiveGameplayTime;

  const performLogout = () => {
    clearLocalStoragePreservingOnboarding();
    localStorage.setItem("loggedOut", "true");
    setTimeout(() => localStorage.removeItem("loggedOut"), 500);
    Cookies.remove("jwt");
    setUser(undefined);
    setIsSidebarOpen(false);
    queryClient.clear();
    setIsLogoutModalOpen(false);
    navigate("/login");
  };

  const handleEndSessionsAndLogout = () => {
    const finishHour = format(new Date(), "HH:mm");

    const mutationOptions = {
      onSuccess: () => {
        toast.success(t("Session ended successfully"));
        performLogout();
      },
      onError: () => {
        toast.error(t("Error ending session"));
      },
    };

    if (userActiveBreak) {
      updateBreak(
        {
          id: userActiveBreak._id.toString(),
          updates: { finishHour },
        },
        mutationOptions
      );
    } else if (userActiveGameplayTime) {
      updateGameplayTime(
        {
          id: userActiveGameplayTime._id.toString(),
          updates: { finishHour },
        },
        mutationOptions
      );
    }
  };

  const handleClose = () => {
    setIsLogoutModalOpen(false);
  };

  // Modal only shows when there's an active session (check is done in Sidebar/PageSelector)
  if (!isLogoutModalOpen || !hasActiveSession) {
    return null;
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 max-w-md w-[90%] mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {t("Active Session Warning")}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MdClose className="text-xl text-gray-500" />
          </button>
        </div>

        {/* Active Sessions Info */}
        <div className="space-y-3 mb-6">
          {userActiveBreak && (
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <MdCoffee className="text-xl text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-orange-800">
                  {t("Active Break")}
                </p>
                <p className="text-sm text-orange-600">
                  {t("Started at")} {userActiveBreak.startHour}
                </p>
              </div>
            </div>
          )}

          {userActiveGameplayTime && (
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <MdSportsEsports className="text-xl text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-purple-800">
                  {t("Active Gameplay Session")}
                </p>
                <p className="text-sm text-purple-600">
                  {t("Started at")} {userActiveGameplayTime.startHour}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Warning Message */}
        <p className="text-gray-600 text-center mb-6">
          {userActiveBreak
            ? t("If you logout, your break time will continue running.")
            : t("If you logout, your gameplay time will continue running.")}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors duration-200"
          >
            {t("Cancel")}
          </button>
          <button
            onClick={handleEndSessionsAndLogout}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200"
          >
            {userActiveBreak
              ? t("End Break & Logout")
              : t("End Gameplay & Logout")}
          </button>
        </div>
      </div>
    </div>
  );
};
