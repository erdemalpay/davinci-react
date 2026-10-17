import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdStairs } from "react-icons/md";
import { useLocationContext } from "../../context/Location.context";
import { useUserContext } from "../../context/User.context";
import { useGetUpstairsDuties } from "../../utils/api/upstairsDuty";

// Tells a game master when they're put on the upstairs duty ("Üstçü") and
// when it ends; both happen automatically.
export const UpstairsDutyNotice = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const { selectedLocationId } = useLocationContext();
  const duties = useGetUpstairsDuties(
    selectedLocationId || 0,
    format(new Date(), "yyyy-MM-dd")
  );
  const myDuty = duties?.find((d) => d.user === user?._id && !d.finishHour);
  const lastDutyId = useRef<number>();
  const [notice, setNotice] = useState<"started" | "ended">();

  useEffect(() => {
    if (!duties) return;
    const previous = lastDutyId.current;
    if (myDuty && myDuty._id !== previous) {
      // Only a duty starting while the panel is open, not one found on load.
      if (previous !== undefined || isRecent(myDuty.startHour)) {
        setNotice("started");
      }
    } else if (!myDuty && previous) {
      setNotice("ended");
    }
    lastDutyId.current = myDuty?._id ?? 0;
  }, [duties, myDuty]);

  if (!notice) return null;
  const started = notice === "started";
  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MdStairs className="text-4xl text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          {started
            ? t("You're on upstairs duty")
            : t("Your upstairs duty is over")}
        </h2>
        <p className="text-gray-600 mb-6">
          {started
            ? t(
                "Upstairs is busy. Stay upstairs: the upstairs tables' calls come to you first."
              )
            : t("Upstairs is calmer now. You're back to normal.")}
        </p>
        <button
          onClick={() => setNotice(undefined)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl text-lg"
        >
          {t("OK")}
        </button>
      </div>
    </div>
  );
};

// Started in the last few minutes ("HH:mm" today).
function isRecent(hour: string) {
  const [h, m] = hour.split(":").map(Number);
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() - (h * 60 + m) <= 5;
}
