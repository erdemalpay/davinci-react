import { useTranslation } from "react-i18next";

type Props = {
  header: string;
  firstSubHeader: string;
  firstSubHeaderValue?: string;
  secondSubHeader?: string;
  secondSubHeaderValue?: string;
  percentage?: number;
  sideColor?: string;
  difference?: string;
};

const SummaryCard = ({
  header,
  firstSubHeader,
  firstSubHeaderValue,
  secondSubHeader,
  secondSubHeaderValue,
  percentage,
  sideColor,
  difference,
}: Props) => {
  const { t } = useTranslation();

  return (
    <div
      className={`w-full bg-white shadow-sm h-28 __className_a182b8 border border-gray-200 rounded-lg`}
      style={{ borderLeft: `4px solid ${sideColor}` }}
    >
      <div className="flex flex-col gap-4 px-4 py-2 ">
        <p className="font-semibold text-sm">{header}</p>
        <div className="flex flex-row justify-between items-start gap-2">
          <div className="flex flex-col gap-2 text-xs flex-1 min-w-0">
            <p className="truncate">
              {firstSubHeader + ":  "}{" "}
              <span className="font-semibold">{firstSubHeaderValue}</span>
            </p>
            {secondSubHeader && (
              <p className="truncate">
                {secondSubHeader + ":  "}
                <span className="font-semibold">{secondSubHeaderValue}</span>
              </p>
            )}
          </div>
          {(percentage || difference) && (
            <div className="flex flex-col gap-1 flex-shrink-0">
              <p className="text-xs font-semibold whitespace-nowrap">
                {t("Difference")}
              </p>
              {difference && (
                <p
                  className={`px-2 py-0.5 bg-opacity-50 font-bold rounded-lg text-xs whitespace-nowrap ${
                    Number(difference) > 0
                      ? "bg-green-500 text-green-600"
                      : "bg-red-500 text-red-800"
                  }`}
                >
                  <span className="truncate max-w-[80px]">{difference}</span>
                </p>
              )}

              {percentage && (
                <p
                  className={`px-2 py-0.5 bg-opacity-50 font-bold rounded-lg text-xs whitespace-nowrap ${
                    percentage > 0
                      ? "bg-green-500 text-green-600"
                      : "bg-red-500 text-red-800"
                  }`}
                >
                  {percentage} %
                </p>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
