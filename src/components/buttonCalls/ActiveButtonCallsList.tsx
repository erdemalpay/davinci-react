import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaDice, FaHandPaper, FaUserCheck } from "react-icons/fa";
import { HiBellAlert } from "react-icons/hi2";
import { MdOutlineRestaurantMenu, MdOutlineRoomService } from "react-icons/md";
import { useDataContext } from "../../context/Data.context";
import { useLocationContext } from "../../context/Location.context";
import { useUserContext } from "../../context/User.context";
import {
  ButtonCall,
  ButtonCallType,
  ButtonCallTypeEnum,
  GmCallReasonEnum,
} from "../../types";
import {
  useClaimButtonCallMutation,
  useDeclineButtonCallMutation,
  useFinishButtonCallMutation,
  useGetActiveButtonCalls,
} from "../../utils/api/buttonCall";

const gmCallReasonLabels: Record<GmCallReasonEnum, string> = {
  [GmCallReasonEnum.RECOMMENDATION]: "Game recommendation",
  [GmCallReasonEnum.EXPLANATION]: "Game explanation",
  [GmCallReasonEnum.QUESTION]: "Question about the game",
};

export function ActiveButtonCallsList() {
  const { t } = useTranslation();
  const { mutate: finishButtonCall } = useFinishButtonCallMutation();
  const { mutate: declineButtonCall } = useDeclineButtonCallMutation();
  const { mutate: claimButtonCall } = useClaimButtonCallMutation();
  const { user } = useUserContext();
  const { users, games } = useDataContext();
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

  // A game master handles one call at a time, so someone with an open call
  // can't take over another one.
  const hasOwnOpenGmCall = activeButtonCalls.some(
    (call) =>
      call.type === ButtonCallTypeEnum.GAMEMASTERCALL &&
      call.assignedTo === user?._id
  );

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
    orderReady: activeButtonCalls.filter(
      (call) => call.type === ButtonCallTypeEnum.ORDERREADYCALL
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
      case ButtonCallTypeEnum.ORDERREADYCALL:
        return "bg-purple-500 hover:bg-purple-600";
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
      case ButtonCallTypeEnum.ORDERREADYCALL:
        return <MdOutlineRoomService className="text-lg sm:text-xl" />;
      default:
        return <HiBellAlert className="text-lg sm:text-xl" />;
    }
  }

  function handleChipClose(buttonCallId: string, buttonCallType: string) {
    const buttonCall = buttonCalls?.find(
      (buttonCallItem) =>
        buttonCallItem.tableName == buttonCallId &&
        buttonCallItem.type == buttonCallType
    );
    const now = new Date();
    const formattedTime = now.toLocaleTimeString("tr-TR", { hour12: false });

    if (buttonCall)
      finishButtonCall({
        location: selectedLocationId,
        tableName: buttonCall.tableName,
        hour: formattedTime,
        type: buttonCall.type,
      });
  }

  const [timeAgo, setTimeAgo] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgo(() => {
        const newTimes: { [key: string]: string } = {};
        activeButtonCalls.forEach((buttonCall) => {
          const diffInSeconds = getElapsedSeconds(buttonCall.startHour);
          const uniqueKey = `${buttonCall.tableName}-${buttonCall.type}`;
          newTimes[uniqueKey] = formatTimeAgo(diffInSeconds);
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

  // Title of a game master call: why the table called, which game and who
  // is assigned.
  const getGmCallDetails = (buttonCall: ButtonCall) => {
    const parts = [];
    if (buttonCall.gmCallReason) {
      parts.push(t(gmCallReasonLabels[buttonCall.gmCallReason]));
    }
    if (buttonCall.game) {
      const gameName = games?.find((g) => g._id === buttonCall.game)?.name;
      if (gameName) parts.push(gameName);
    }
    const assigneeName = users?.find(
      (u) => u._id === buttonCall.assignedTo
    )?.name;
    parts.push(
      assigneeName ? `${t("Assigned to")}: ${assigneeName}` : t("Unassigned")
    );
    if (buttonCall.explainerUnavailable) {
      parts.push(t("Nobody left who knows the game"));
    }
    return parts.join(" · ");
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
          {calls.map((buttonCall) => {
            const uniqueKey = `${buttonCall.tableName}-${buttonCall.type}`;
            const isGmCall =
              buttonCall.type === ButtonCallTypeEnum.GAMEMASTERCALL;
            const isMine = isGmCall && buttonCall.assignedTo === user?._id;
            const assigneeName = isGmCall
              ? users?.find((u) => u._id === buttonCall.assignedTo)?.name
              : undefined;
            return (
              <div
                key={uniqueKey}
                className={`${getBackgroundColor(buttonCall.type)} ${
                  isMine
                    ? "ring-4 ring-red-600 ring-offset-1 animate-pulse"
                    : ""
                } relative group text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm transition-all duration-200 flex items-center gap-1 sm:gap-1.5 cursor-pointer min-h-[24px] sm:min-h-[28px]`}
                title={`${buttonCall.tableName} - ${
                  timeAgo[uniqueKey] || "00:00"
                }${isGmCall ? ` - ${getGmCallDetails(buttonCall)}` : ""}`}
              >
                {/* Masa Adı */}
                <span className="text-[10px] sm:text-xs font-semibold whitespace-nowrap">
                  {buttonCall.tableName}
                </span>

                {/* Süre */}
                <span className="text-[9px] sm:text-[10px] font-mono opacity-90 whitespace-nowrap">
                  {timeAgo[uniqueKey] || "00:00"}
                </span>

                {/* Atanan kişi */}
                {isGmCall && (
                  <span className="text-[9px] sm:text-[10px] whitespace-nowrap opacity-90">
                    {isMine ? t("You") : assigneeName ?? "—"}
                  </span>
                )}

                {/* Gidemiyorum / Üstüme al */}
                {isGmCall && (isMine || !hasOwnOpenGmCall) && (
                  <button
                    onClick={() =>
                      isMine
                        ? declineButtonCall(buttonCall._id)
                        : claimButtonCall(buttonCall._id)
                    }
                    className="ml-1 w-7 h-7 sm:w-8 sm:h-8 bg-white/25 hover:bg-white/40 active:bg-white/60 rounded-full flex items-center justify-center text-white transition-all duration-200 touch-manipulation"
                    title={isMine ? t("I can't go") : t("Take over")}
                    aria-label={isMine ? t("I can't go") : t("Take over")}
                  >
                    {isMine ? (
                      <FaHandPaper className="text-sm sm:text-base" />
                    ) : (
                      <FaUserCheck className="text-sm sm:text-base" />
                    )}
                  </button>
                )}

                {/* Kapat Butonu - Sipariş hazır çağrısı sadece Siparişler sayfasından kapatılır */}
                {buttonCall.type !== ButtonCallTypeEnum.ORDERREADYCALL && (
                  <button
                    onClick={() =>
                      handleChipClose(buttonCall.tableName, buttonCall.type)
                    }
                    className="ml-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-white/20 hover:bg-white/40 active:bg-white/60 rounded-full flex items-center justify-center text-white text-[9px] sm:text-[10px] transition-all duration-200 touch-manipulation"
                    aria-label="Çağrıyı kapat"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
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
        {groupedCalls?.gameMasterAndTable.length > 0 &&
          renderCallGroup(
            groupedCalls?.gameMasterAndTable,
            ButtonCallTypeEnum.GAMEMASTERCALL
          )}

        {groupedCalls?.order?.length > 0 &&
          renderCallGroup(groupedCalls?.order, ButtonCallTypeEnum.ORDERCALL)}

        {groupedCalls?.orderReady?.length > 0 &&
          renderCallGroup(
            groupedCalls?.orderReady,
            ButtonCallTypeEnum.ORDERREADYCALL
          )}
      </div>
    </div>
  );
}
