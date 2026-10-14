import { format } from "date-fns";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getBreakWarning } from "../components/header/breakWarning";
import { useDataContext } from "../context/Data.context";
import { useLocationContext } from "../context/Location.context";
import { useUserContext } from "../context/User.context";
import { BreakTypeEnum, breakTypeOf, Shift } from "../types";
import { useGetBreaksByLocation } from "../utils/api/break";
import { useGetShifts } from "../utils/api/shift";
import { getItem, getRefId } from "../utils/getItem";

// Whether the current user going on a break needs a confirmation (see
// getBreakWarning), the confirmation text, and who else is on a break.
export function useBreakWarning() {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const { selectedLocationId } = useLocationContext();
  const { visits = [], users = [] } = useDataContext();
  const activeBreaks = useGetBreaksByLocation(selectedLocationId || 0);

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

  const warning = getBreakWarning(othersOnBreak.length, staffInCafeCount);
  const names = othersOnBreak.join(", ");
  const text =
    warning === "lowStaff"
      ? t(
          "There aren't enough staff in the cafe right now ({{names}} on break). Do you still want to take a break?",
          { names }
        )
      : t(
          "{{names}} are currently on break. Do you still want to take a break?",
          { names }
        );

  return { warning, text, activeBreaks };
}
