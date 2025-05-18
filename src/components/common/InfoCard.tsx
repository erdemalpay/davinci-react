import { useTranslation } from "react-i18next";

type Props = {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
  isAverage?: boolean;
  averageValue?: string | number;
  onClick?: () => void;
};
const InfoCard = ({
  icon,
  title,
  value,
  color,
  isAverage,
  averageValue,
  onClick,
}: Props) => {
  const { t } = useTranslation();
  return (
    <div
      className={`flex flex-col gap-5 py-6 px-10 items-center justify-center bg-${color}-300 bg-opacity-20 text-${color}-500 rounded-md ${
        onClick &&
        "transform transition duration-300 hover:scale-105 bg-opacity-10"
      } `}
      onClick={onClick}
    >
      <div className="text-4xl  ">{icon}</div>
      <div className="flex flex-col items-center font-medium gap-3">
        <div className="flex flex-col items-center font-medium gap-2">
          <p className="text-center">{title}</p>
          <p>
            {isAverage && averageValue && t("Total") + ": "}
            {value}
          </p>
        </div>
        {isAverage && averageValue && (
          <div className="flex flex-row items-center gap-2 font-semibold">
            <p>{t("Average")}:</p>
            <p>{averageValue}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoCard;
