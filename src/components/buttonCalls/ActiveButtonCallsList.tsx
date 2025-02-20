import { useLocationContext } from "../../context/Location.context";
import { ButtonCall } from "../../types";
import { InputWithLabelProps } from "../common/InputWithLabel";
import { useFinishButtonCallMutation } from "../../utils/api/buttonCall";
import { useEffect, useState } from "react";
interface ActiveMentorListProps extends InputWithLabelProps {
  buttonCalls: ButtonCall[];
}

export function ActiveButtonCallsList({
  buttonCalls,
}: ActiveMentorListProps) {
  const { mutate: finishButtonCall } = useFinishButtonCallMutation();
  const { selectedLocationId } = useLocationContext();

  const activeButtonCalls = buttonCalls.reduce(
    (acc: { active: typeof buttonCalls; }, buttonCall) => {
      if (buttonCall?.location == selectedLocationId && !(buttonCall?.finishHour)) {
        acc.active.push(buttonCall);
      }
      return acc;
    },
    { active: [] }
  ).active;

  function handleChipClose(buttonCallId: string) {
    const buttonCall = buttonCalls.find(
      (buttonCallItem) => buttonCallItem.tableName == buttonCallId
    );
    if (buttonCall) finishButtonCall({ location: selectedLocationId, tableName: buttonCall.tableName });
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
    return Math.floor((now.getTime() - startTime.getTime()) / 1000) - 10800;
  };

  const formatTimeAgo = (seconds: number): string => {
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  };

  return (<div className="flex flex-col w-full">
      <div className="flex flex-wrap gap-3 mt-4 justify-start">
        {activeButtonCalls.map((buttonCall) => (
          <div
            key={buttonCall.tableName}
            className="bg-green-600 text-white px-5 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex flex-col items-center"
          >
            <button
              onClick={() => handleChipClose(buttonCall.tableName)}
              className="absolute top-1 right-1.5 text-xs text-amber-50 hover:text-blue-100">
              ✖
            </button>
            <span className="text-md my-2 font-semibold">{buttonCall.tableName}</span>
            <span className="text-sm opacity-90 mb-2">{timeAgo[buttonCall.tableName] || ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
