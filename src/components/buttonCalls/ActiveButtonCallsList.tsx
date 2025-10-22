import { useEffect, useState } from "react";
import { FaDice } from "react-icons/fa";
import { HiBellAlert } from "react-icons/hi2";
import { MdOutlineRestaurantMenu } from "react-icons/md";
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

  // Çağrıları tipine göre grupla
  const groupedCalls = {
    gameMasterAndTable: activeButtonCalls.filter(
      (call) =>
        call.type === ButtonCallTypeEnum.GAMEMASTERCALL ||
        call.type === ButtonCallTypeEnum.TABLECALL
    ),
    order: activeButtonCalls.filter(
      (call) => call.type === ButtonCallTypeEnum.ORDERCALL
    ),
  };

  function getBackgroundColor(type: ButtonCallTypeEnum) {
    switch (type) {
      case ButtonCallTypeEnum.TABLECALL:
        return "bg-green-500 hover:bg-green-600";
      case ButtonCallTypeEnum.GAMEMASTERCALL:
        return "bg-blue-500 hover:bg-blue-600";
      case ButtonCallTypeEnum.ORDERCALL:
        return "bg-orange-500 hover:bg-orange-600";
      default:
        return "bg-green-500 hover:bg-green-600";
    }
  }

  function getIcon(type: ButtonCallTypeEnum) {
    switch (type) {
      case ButtonCallTypeEnum.TABLECALL:
        return <HiBellAlert className="text-lg sm:text-xl" />;
      case ButtonCallTypeEnum.GAMEMASTERCALL:
        return <FaDice className="text-lg sm:text-xl" />;
      case ButtonCallTypeEnum.ORDERCALL:
        return <MdOutlineRestaurantMenu className="text-lg sm:text-xl" />;
      default:
        return <HiBellAlert className="text-lg sm:text-xl" />;
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

  const renderCallGroup = (
    calls: typeof activeButtonCalls,
    type: ButtonCallTypeEnum
  ) => {
    if (calls.length === 0) return null;

    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="text-gray-600 flex-shrink-0">{getIcon(type)}</div>

        <div className="text-gray-400 text-xs sm:text-sm flex-shrink-0">─</div>

        <div className="flex flex-wrap gap-1 sm:gap-1.5">
          {calls.map((buttonCall) => (
            <div
              key={buttonCall.tableName}
              className={`${getBackgroundColor(
                buttonCall.type
              )} relative group text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm transition-all duration-200 flex items-center gap-1 sm:gap-1.5 cursor-pointer min-h-[24px] sm:min-h-[28px]`}
              title={`${buttonCall.tableName} - ${
                timeAgo[buttonCall.tableName] || "00:00"
              }`}
            >
              {/* Masa Adı */}
              <span className="text-[10px] sm:text-xs font-semibold whitespace-nowrap">
                {buttonCall.tableName}
              </span>

              {/* Süre */}
              <span className="text-[9px] sm:text-[10px] font-mono opacity-90 whitespace-nowrap">
                {timeAgo[buttonCall.tableName] || "00:00"}
              </span>

              {/* Kapat Butonu - Her zaman görünür */}
              <button
                onClick={() => handleChipClose(buttonCall.tableName)}
                className="ml-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-white/20 hover:bg-white/40 active:bg-white/60 rounded-full flex items-center justify-center text-white text-[9px] sm:text-[10px] transition-all duration-200 touch-manipulation"
                aria-label="Çağrıyı kapat"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (activeButtonCalls.length === 0) return null;

  return (
    <div
      key={buttonCalls?.length}
      className="flex flex-col w-full px-2 sm:px-0"
    >
      <div className="flex flex-col gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
        {groupedCalls.gameMasterAndTable.length > 0 &&
          renderCallGroup(
            groupedCalls.gameMasterAndTable,
            ButtonCallTypeEnum.GAMEMASTERCALL
          )}

        {groupedCalls.order.length > 0 &&
          renderCallGroup(groupedCalls.order, ButtonCallTypeEnum.ORDERCALL)}
      </div>
    </div>
  );
}
