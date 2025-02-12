import { Chip } from "@material-tailwind/react";
import { useLocationContext } from "../../context/Location.context";
import { ButtonCall } from "../../types";
import { InputWithLabelProps } from "../common/InputWithLabel";
import { useFinishButtonCallMutation } from "../../utils/api/buttonCall";
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

  return (<div className="flex flex-col w-full">
      <div className="flex flex-wrap gap-3 mt-4 justify-start">
        {activeButtonCalls.map((buttonCall) => (
          <Chip
            key={buttonCall.tableName}
            value={buttonCall.tableName}
            style={{
              backgroundColor: "#4cae50",
              height: "auto",
              borderRadius: "8px",
            }}
            className="px-5 py-3 text-md text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            onClose={() => handleChipClose(buttonCall.tableName)}
          />
        ))}
      </div>
    </div>
  );
}
