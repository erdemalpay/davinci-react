import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaDice } from "react-icons/fa";
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
import { DeclineCallDialog } from "./DeclineCallDialog";

// Holding a call assigned to me this long opens the decline reasons; a
// short tap does nothing, so a call isn't declined by accident.
export const DECLINE_HOLD_MS = 600;

const isAssignedCallType = (type: ButtonCallTypeEnum) =>
  type === ButtonCallTypeEnum.GAMEMASTERCALL ||
  type === ButtonCallTypeEnum.ORDERCALL;

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

  const [callToDecline, setCallToDecline] = useState<ButtonCall | null>(null);
  // A tapped call: close it, or take it over when possible.
  const [callForActions, setCallForActions] = useState<ButtonCall | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout>>();
  // The click that ends a hold must not also open the actions.
  const isHoldDone = useRef(false);

  const startHold = (buttonCall: ButtonCall) => {
    clearTimeout(holdTimer.current);
    isHoldDone.current = false;
    holdTimer.current = setTimeout(() => {
      isHoldDone.current = true;
      setCallToDecline(buttonCall);
    }, DECLINE_HOLD_MS);
  };
  const cancelHold = () => clearTimeout(holdTimer.current);
  useEffect(() => cancelHold, []);

  // Someone handles one call at a time (game master or service call), so
  // someone with an open call can't take over another one.
  const hasOwnOpenCall = activeButtonCalls.some(
    (call) => isAssignedCallType(call.type) && call.assignedTo === user?._id
  );
  const canTakeOver = (call: ButtonCall) =>
    isAssignedCallType(call.type) &&
    call.assignedTo !== user?._id &&
    !hasOwnOpenCall;

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
            // Game master and service calls are assigned to a person.
            const isAssigned = isAssignedCallType(buttonCall.type);
            const isMine = isAssigned && buttonCall.assignedTo === user?._id;
            const assigneeName = isAssigned
              ? users?.find((u) => u._id === buttonCall.assignedTo)?.name
              : undefined;
            // Order ready calls are only closed from the Orders page.
            const hasActions =
              buttonCall.type !== ButtonCallTypeEnum.ORDERREADYCALL;
            const gameName = buttonCall.game
              ? games?.find((g) => g._id === buttonCall.game)?.name
              : undefined;
            return (
              <div
                key={uniqueKey}
                className={`${getBackgroundColor(buttonCall.type)} ${
                  isMine
                    ? "select-none touch-manipulation [-webkit-touch-callout:none]"
                    : ""
                } relative group text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm transition-all duration-200 flex items-center gap-1 sm:gap-1.5 cursor-pointer min-h-[24px] sm:min-h-[28px]`}
                title={`${buttonCall.tableName} - ${
                  timeAgo[uniqueKey] || "00:00"
                }${isAssigned ? ` - ${getGmCallDetails(buttonCall)}` : ""}${
                  isMine ? ` - ${t("Hold to decline")}` : ""
                }`}
                {...(hasActions && {
                  role: "button",
                  "aria-label": `${buttonCall.tableName} - ${t(
                    canTakeOver(buttonCall)
                      ? "Take over or close"
                      : "Close call"
                  )}`,
                  onClick: () => {
                    if (isHoldDone.current) {
                      isHoldDone.current = false;
                      return;
                    }
                    setCallForActions(buttonCall);
                  },
                })}
                {...(isMine && {
                  role: "button",
                  "aria-label": `${buttonCall.tableName} - ${t(
                    "Hold to decline"
                  )}`,
                  onPointerDown: () => startHold(buttonCall),
                  onPointerUp: cancelHold,
                  onPointerLeave: cancelHold,
                  onPointerCancel: cancelHold,
                  // Long press on touch screens opens the browser menu.
                  onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
                })}
              >
                {/* Bana atanan çağrı: sadece halka yanıp söner, yazılar okunur kalır */}
                {isMine && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-1 rounded-full ring-4 ring-red-600 animate-pulse"
                  />
                )}

                {/* Masa Adı */}
                <span className="text-[10px] sm:text-xs font-semibold whitespace-nowrap">
                  {buttonCall.tableName}
                </span>

                {/* Süre */}
                <span className="text-[9px] sm:text-[10px] font-mono opacity-90 whitespace-nowrap">
                  {timeAgo[uniqueKey] || "00:00"}
                </span>

                {/* Anlatılması istenen oyun */}
                {isGmCall && gameName && (
                  <span className="text-[9px] sm:text-[10px] font-semibold whitespace-nowrap max-w-[8rem] truncate">
                    {gameName}
                  </span>
                )}

                {/* Atanan kişi */}
                {isAssigned && (
                  <span className="text-[9px] sm:text-[10px] whitespace-nowrap opacity-90">
                    {isMine ? t("You") : assigneeName ?? "—"}
                  </span>
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

      {callForActions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setCallForActions(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${t("Table")} ${callForActions.tableName}`}
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              {t("Table")} {callForActions.tableName}
            </h3>
            <div className="flex flex-col gap-2">
              {canTakeOver(callForActions) && (
                <button
                  onClick={() => {
                    claimButtonCall(callForActions._id);
                    setCallForActions(null);
                  }}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700"
                >
                  {t("Take over")}
                </button>
              )}
              <button
                onClick={() => {
                  handleChipClose(
                    callForActions.tableName,
                    callForActions.type
                  );
                  setCallForActions(null);
                }}
                className="w-full rounded-lg bg-gray-100 px-4 py-3 font-medium text-gray-800 hover:bg-gray-200"
              >
                {t("Close call")}
              </button>
              <button
                onClick={() => setCallForActions(null)}
                className="w-full rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                {t("Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {callToDecline && (
        <DeclineCallDialog
          tableName={callToDecline.tableName}
          canNotKnowGame={
            callToDecline.type === ButtonCallTypeEnum.GAMEMASTERCALL
          }
          game={callToDecline.game}
          games={games ?? []}
          onCancel={() => setCallToDecline(null)}
          onDecline={(reason, note, game) => {
            declineButtonCall({ id: callToDecline._id, reason, note, game });
            setCallToDecline(null);
          }}
        />
      )}
    </div>
  );
}
