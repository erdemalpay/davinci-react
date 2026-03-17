import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GiRoundTable } from "react-icons/gi";
import { MdVisibilityOff } from "react-icons/md";
import { toast } from "react-toastify";
import { useTemporarilyHiddenModal } from "../../hooks/useTemporarilyHiddenModal";
import { useUserContext } from "../../context/User.context";
import { Middleman } from "../../types";
import {
  useGetMiddlemanByDate,
  useMiddlemanMutations,
} from "../../utils/api/middleman";

const STRIP_HEIGHT_PX = 32;
const BODY_ATTR = "data-middleman-strip";

export const MiddlemanOverlay = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const { updateMiddleman } = useMiddlemanMutations();
  const [currentMiddleman, setCurrentMiddleman] = useState<Middleman | null>(
    null
  );
  const [currentTime, setCurrentTime] = useState(new Date());
  const todayDate = format(new Date(), "yyyy-MM-dd");
  const activeMiddlemen = useGetMiddlemanByDate(todayDate);
  const { isModalHidden, handleHideModal, handleShowModal } =
    useTemporarilyHiddenModal(!!currentMiddleman);

  useEffect(() => {
    const showStrip = !!user && !!currentMiddleman && isModalHidden;
    if (showStrip) {
      document.body.setAttribute(BODY_ATTR, "true");
    } else {
      document.body.removeAttribute(BODY_ATTR);
    }
    return () => document.body.removeAttribute(BODY_ATTR);
  }, [user, currentMiddleman, isModalHidden]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) {
      setCurrentMiddleman(null);
      return;
    }
    if (activeMiddlemen) {
      const userActive = activeMiddlemen.find(
        (m) =>
          (typeof m.user === "string" ? m.user : m.user._id) === user._id &&
          !m.finishHour
      );
      setCurrentMiddleman(userActive || null);
    }
  }, [activeMiddlemen, user]);

  if (!user) return null;

  const handleEnd = () => {
    if (!currentMiddleman) return;
    updateMiddleman({
      id: currentMiddleman._id.toString(),
      updates: { finishHour: format(new Date(), "HH:mm") },
    });
    toast.success(t("Middleman ended"));
  };

  const getDuration = () => {
    if (!currentMiddleman?.startHour) return "0";
    const today = format(new Date(), "yyyy-MM-dd");
    const start = new Date(`${today}T${currentMiddleman.startHour}:00`);
    const diffMs = currentTime.getTime() - start.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60))).toString();
  };

  if (!currentMiddleman) return null;

  if (isModalHidden) {
    return (
      <div className="fixed top-16 left-0 right-0 z-40 pointer-events-none">
        <div
          onClick={handleShowModal}
          className="pointer-events-auto cursor-pointer bg-gradient-to-r from-teal-500 to-teal-700 animate-pulse shadow-sm py-1.5 md:py-1"
          style={{ minHeight: STRIP_HEIGHT_PX }}
        >
          <div className="px-3 flex items-center justify-center gap-2">
            <GiRoundTable className="text-white text-xs shrink-0 md:text-sm" />
            <span className="text-white text-xs font-medium md:text-sm">
              {t("You're the middleman")} – {getDuration()} {t("minutes")}
            </span>
            <span className="text-white/70 text-xs shrink-0 hidden sm:inline">
              ({t("Click to open")})
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 max-w-md w-[90%] mx-4 text-center shadow-2xl">
        <div className="mb-6">
          <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <GiRoundTable className="text-4xl text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {t("You're the middleman")}
          </h2>
          <p className="text-gray-600">
            {t("Started at")} {currentMiddleman.startHour}
          </p>
        </div>

        <div className="mb-6">
          <div className="text-4xl font-bold text-teal-600 mb-2">
            {getDuration()}
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
            onClick={handleEnd}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 text-lg"
          >
            {t("End")}
          </button>
        </div>
      </div>
    </div>
  );
};
