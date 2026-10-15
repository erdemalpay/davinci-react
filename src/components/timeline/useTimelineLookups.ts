import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDataContext } from "../../context/Data.context";
import { useGetAccountPaymentMethods } from "../../utils/api/account/paymentMethod";
import { useGetAllLocations } from "../../utils/api/location";
import { TimelineLookups } from "./timelineDisplay";

// Names for the ids on a timeline.
export function useTimelineLookups(): TimelineLookups {
  const { t } = useTranslation();
  const { users = [], games = [], menuItems = [] } = useDataContext();
  const paymentMethods = useGetAccountPaymentMethods() ?? [];
  const locations = useGetAllLocations() ?? [];
  return useMemo(
    () => ({ t, users, games, menuItems, paymentMethods, locations }),
    [t, users, games, menuItems, paymentMethods, locations]
  );
}
