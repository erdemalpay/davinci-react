import { useEffect, useState } from "react";
import { useLocationContext } from "../../context/Location.context";
import { ButtonCallType, ButtonCallTypeEnum } from "../../types";
import {
  useFinishButtonCallMutation,
  useGetActiveButtonCalls,
} from "../../utils/api/buttonCall";

export function ActiveButtonCallsList() {
  const { mutate: finishButtonCall } = useFinishButtonCallMutation();
  const { selectedLocationId } = useLocationContext();
  const buttonCalls = useGetActiveButtonCalls(ButtonCallType.ACTIVE);
  const activeButtonCalls = buttonCalls?.reduce(
    (acc: { active: typeof buttonCalls }, buttonCall) => {
      if (
        buttonCall?.location == selectedLocationId &&
        !buttonCall?.finishHour
      ) {
        acc.active.push(buttonCall);
      }
      return acc;
    },
    { active: [] }
  ).active;
  function getBackgroundColor(type: ButtonCallTypeEnum) {
    switch (type) {
      case ButtonCallTypeEnum.TABLECALL:
        return "bg-green-500";
      case ButtonCallTypeEnum.GAMEMASTERCALL:
        return "bg-blue-500";
      case ButtonCallTypeEnum.ORDERCALL:
        return "bg-orange-500";
      default:
        return "bg-green-500";
    }
  }
  function handleChipClose(buttonCallId: string) {
    const buttonCall = buttonCalls?.find(
      (buttonCallItem) => buttonCallItem.tableName == buttonCallId
    );
    const now = new Date();
    const formattedTime = now.toLocaleTimeString("tr-TR", { hour12: false });

    if (buttonCall)
      finishButtonCall({
        location: selectedLocationId,
        tableName: buttonCall.tableName,
        hour: formattedTime,
      });
  }

  const [timeAgo, setTimeAgo] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgo(() => {
        const newTimes: { [key: string]: string } = {};
        activeButtonCalls.forEach((buttonCall) => {
          const diffInSeconds = getElapsedSeconds(buttonCall.startHour);
          newTimes[buttonCall.tableName] = formatTimeAgo(diffInSeconds);
        });
        return newTimes;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeButtonCalls]);

  const getElapsedSeconds = (startHour: string): number => {
    const timeParts = startHour.split(":").map(Number);
    if (timeParts.length !== 3 || timeParts.some(isNaN)) return 0;

    const [hours, minutes, seconds] = timeParts;
    const startTime = new Date();
    startTime.setHours(hours, minutes, seconds, 0);

    const now = new Date();
    return Math.floor((now.getTime() - startTime.getTime()) / 1000);
  };

  const formatTimeAgo = (seconds: number): string => {
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
      seconds % 60
    ).padStart(2, "0")}`;
  };

  return (
    <div key={buttonCalls?.length} className="flex flex-col w-full">
      <div className="flex flex-wrap gap-3 mt-4 justify-start">
        {activeButtonCalls.map((buttonCall) => (
          <div
            key={buttonCall.tableName}
            className={`${getBackgroundColor(
              buttonCall?.type ?? ButtonCallTypeEnum.TABLECALL
            )} text-white px-5 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex flex-col items-center`}
          >
            <button
              onClick={() => handleChipClose(buttonCall.tableName)}
              className="absolute top-1 right-1.5 text-xs text-amber-50 hover:text-blue-100"
            >
              ✖
            </button>
            <span className="text-md my-2 font-semibold">
              {buttonCall.tableName}
            </span>
            <span className="text-sm opacity-90 mb-2">
              {timeAgo[buttonCall.tableName] || ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
