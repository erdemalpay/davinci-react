import { Chip } from "@material-tailwind/react";
import { useLocationContext } from "../../context/Location.context";
import { ButtonCall } from "../../types";
import { InputWithLabelProps } from "../common/InputWithLabel";
import { useFinishButtonCallMutation } from "../../utils/api/buttonCalls";
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
      if (buttonCall?.location == selectedLocationId && buttonCall?.finishHour == '') {
        acc.active.push(buttonCall);
      }
      return acc;
    },
    { active: [] }
  ).active;

  function handleChipClose(buttonCallId: string) {
    const buttonCall = buttonCalls.find(
      (buttonCallItem) => buttonCallItem._id == buttonCallId && !buttonCallItem?.finishHour
    );
    if (buttonCall) finishButtonCall({ id: buttonCall._id });
  }

  return (<div className="flex flex-col w-full items-center">
      <div className="flex flex-wrap gap-3 mt-4 justify-start items-center">
        {activeButtonCalls.map((buttonCall) => (
          <Chip
            key={buttonCall._id}
            value={buttonCall.tableName}
            style={{
              backgroundColor: buttonCall.finishHour === '' ? "#4cae50" : "#A0AEC0", // Green for unfinished, gray for finished
              height: "auto",
              borderRadius: "8px", // Slightly rounded corners for a rectangular look
            }}
            className="px-5 py-3 text-md text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            onClose={() => handleChipClose(buttonCall._id)}
          />
        ))}
      </div>
    </div>
  );
}
