import { useTranslation } from "react-i18next";
import { IoIosArrowRoundDown, IoIosArrowRoundUp } from "react-icons/io";

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
      className={`bg-white shadow-sm h-28 __className_a182b8 border border-gray-200 rounded-lg`}
      style={{ borderLeft: `4px solid ${sideColor}` }}
    >
      <div className="flex flex-col gap-4 px-4 py-2 ">
        <p className="font-semibold">{header}</p>
        <div className="flex flex-row justify-between">
          <div className="flex flex-col gap-2 text-sm">
            <p>
              {firstSubHeader + ":  "}{" "}
              <span className="font-semibold">{firstSubHeaderValue}</span>
            </p>
            {secondSubHeader && (
              <p>
                {secondSubHeader + ":  "}
                <span className="font-semibold">{secondSubHeaderValue}</span>
              </p>
            )}
          </div>
          {(percentage || difference) && (
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold">{t("Difference")}</p>
              {difference && (
                <p
                  className={`px-2 py-1 bg-opacity-50 font-bold rounded-2xl flex items-center ${
                    Number(difference) > 0
                      ? "bg-green-500 text-green-600"
                      : "bg-red-500 text-red-800"
                  }`}
                >
                  {Number(difference) > 0 ? (
                    <IoIosArrowRoundUp className="text-xl mr-1" />
                  ) : (
                    <IoIosArrowRoundDown className="text-xl mr-1" />
                  )}
                  {difference}
                </p>
              )}
              {percentage && (
                <p
                  className={`px-2 py-0.2 bg-opacity-50 font-bold rounded-2xl flex items-center ${
                    percentage > 0
                      ? "bg-green-500 text-green-600"
                      : "bg-red-500 text-red-800"
                  }`}
                >
                  {percentage > 0 ? (
                    <IoIosArrowRoundUp className="text-xl mr-1" />
                  ) : (
                    <IoIosArrowRoundDown className="text-xl mr-1" />
                  )}
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
