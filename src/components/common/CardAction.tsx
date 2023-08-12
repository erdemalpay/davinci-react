import { useDateContext } from "../../context/Date.context";
import { isToday } from "../../utils/dateUtil";

interface CardActionProps {
  onClick: () => void;
  IconComponent: React.ComponentType<{ className?: string }>;
}

export function CardAction({ onClick, IconComponent }: CardActionProps) {
  const { selectedDate } = useDateContext();
  return selectedDate && isToday(selectedDate) ? (
    <button
      onClick={onClick}
      className="focus:outline-none"
      disabled={!selectedDate || !isToday(selectedDate)}
    >
      <IconComponent className="h-6 w-6" />
    </button>
  ) : null;
}
