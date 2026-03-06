import { format } from "date-fns";
import { useMemo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GiRoundTable } from "react-icons/gi";
import { toast } from "react-toastify";
import { useDataContext } from "../../context/Data.context";
import { useLocationContext } from "../../context/Location.context";
import { useUserContext } from "../../context/User.context";
import { CreateMiddlemanDto, RoleEnum, User } from "../../types";
import { useGetBreaksByLocation } from "../../utils/api/break";
import { useGetGameplayTimesByDate } from "../../utils/api/gameplaytime";
import {
  useMiddlemanMutations,
  useGetMiddlemanByLocation,
} from "../../utils/api/middleman";
import { getRefId } from "../../utils/getItem";
import CustomTooltip from "../panelComponents/Tables/Tooltip";

export const MiddlemanButton = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const { selectedLocationId } = useLocationContext();
  const { visits = [] } = useDataContext();
  const { createMiddleman, updateMiddleman } = useMiddlemanMutations();
  const [isMiddleman, setIsMiddleman] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [otherMiddlemanName, setOtherMiddlemanName] = useState<string>("");

  const activeMiddlemen = useGetMiddlemanByLocation(selectedLocationId || 0);
  const activeBreaks = useGetBreaksByLocation(selectedLocationId || 0);
  const todayDate = format(new Date(), "yyyy-MM-dd");
  const activeGameplayTimes = useGetGameplayTimesByDate(todayDate);

  const isGameRole = useMemo(() => {
    if (!user) return false;
    return (
      user.role._id === RoleEnum.GAMEMASTER ||
      user.role._id === RoleEnum.GAMEMANAGER
    );
  }, [user]);

  const hasActiveVisit = useMemo(() => {
    if (!user || !visits || visits.length === 0) return false;
    return visits.some((v) => v.user === user._id && !v.finishHour);
  }, [visits, user]);

  useEffect(() => {
    if (!activeMiddlemen || !user) {
      setIsMiddleman(false);
      setCurrentId(null);
      setOtherMiddlemanName("");
      return;
    }

    const myRecord = activeMiddlemen.find(
      (m) => getRefId(m.user) === user._id && !m.finishHour
    );
    const othersRecord = activeMiddlemen.find(
      (m) => getRefId(m.user) !== user._id && !m.finishHour
    );

    setIsMiddleman(!!myRecord);
    setCurrentId(myRecord?._id || null);

    if (othersRecord) {
      const name =
        typeof othersRecord.user === "object" && othersRecord.user !== null && "name" in othersRecord.user
          ? (othersRecord.user as User).name || t("Someone")
          : t("Someone");
      setOtherMiddlemanName(name);
    } else {
      setOtherMiddlemanName("");
    }
  }, [activeMiddlemen, user]);

  if (!(isGameRole && hasActiveVisit)) return null;

  const handleStart = () => {
    if (!user || !selectedLocationId) {
      toast.error(t("Please select a location first"));
      return;
    }

    // Cannot start middleman while on break
    const isOnBreak = activeBreaks?.some(
      (b) => getRefId(b.user) === user._id && !b.finishHour
    );
    if (isOnBreak) {
      toast.error(t("You cannot be a middleman while you are on a break"));
      return;
    }

    // Cannot start middleman while in active gameplay time
    const isInGameplay = activeGameplayTimes?.some(
      (g) =>
        getRefId(g.user) === user._id &&
        (typeof g.location === "number" ? g.location : g.location._id) === selectedLocationId &&
        !g.finishHour
    );
    if (isInGameplay) {
      toast.error(t("You cannot be a middleman while you are in a gameplay session"));
      return;
    }

    const data: CreateMiddlemanDto = {
      user: user._id,
      location: selectedLocationId,
      date: format(new Date(), "yyyy-MM-dd"),
      startHour: format(new Date(), "HH:mm"),
    };
    createMiddleman(data);
    toast.success(t("Middleman started"));
  };

  const handleEnd = () => {
    if (!currentId) {
      toast.error(t("No active middleman session found"));
      return;
    }
    updateMiddleman({
      id: currentId,
      updates: { finishHour: format(new Date(), "HH:mm") },
    });
    toast.success(t("Middleman ended"));
  };

  // Someone else is middleman — disabled + tooltip
  if (!isMiddleman && otherMiddlemanName) {
    return (
      <CustomTooltip
        content={
          <span className="text-sm text-gray-700">
            {otherMiddlemanName} {t("is the middleman")}
          </span>
        }
      >
        <div>
          <button
            disabled
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-white font-medium bg-gray-400 cursor-not-allowed opacity-70"
          >
            <GiRoundTable className="text-lg" />
            <span className="hidden sm:inline">{t("Middleman")}</span>
          </button>
        </div>
      </CustomTooltip>
    );
  }

  return (
    <button
      onClick={isMiddleman ? handleEnd : handleStart}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-white font-medium transition-all duration-200 hover:scale-105 ${
        isMiddleman
          ? "bg-red-600 hover:bg-red-700"
          : "bg-teal-600 hover:bg-teal-700"
      }`}
      title={isMiddleman ? t("End Middleman") : t("Start Middleman")}
    >
      <GiRoundTable className="text-lg" />
      <span className="hidden sm:inline">
        {isMiddleman ? t("End Middleman") : t("Middleman")}
      </span>
    </button>
  );
};
