type RowItem = {
  title?: string;
  value?: string | number;
  subtitle?: string;
  bgColor?: string;
};

type Props = {
  header?: string;
  headerClassName?: string;
  headerBgColor?: string;
  headerTextColor?: string;
  rows?: RowItem[];
  titleClassName?: string;
  valueClassName?: string;
  valueColor?: string;
  topClassName?: string;
  variant?: "default" | "metric" | "ranking" | "detail";
  showRankEmojis?: boolean;
};

const SummaryCard = ({
  header,
  headerClassName,
  headerBgColor,
  headerTextColor,
  rows,
  titleClassName,
  valueClassName,
  valueColor,
  topClassName,
  variant = "default",
  showRankEmojis = false,
}: Props) => {
  const getRankEmoji = (index: number) => {
    const emojis = ["🥇", "🥈", "🥉"];
    return emojis[index] || `${index + 1}.`;
  };

  if (variant === "metric") {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
        {header && (
          <div
            className={`p-4 text-center ${headerClassName}`}
            style={{
              backgroundColor: headerBgColor || "#F3F4F6",
            }}
          >
            <h3
              className="font-semibold text-base"
              style={{ color: headerTextColor || "#1F2937" }}
            >
              {header}
            </h3>
          </div>
        )}
        <div className="p-6 flex flex-col items-center justify-center gap-2">
          {rows && rows[0] && (
            <>
              <p
                className={`text-4xl font-bold ${valueClassName}`}
                style={{ color: valueColor || "#1F2937" }}
              >
                {rows[0].value}
              </p>
              {rows[0].subtitle && (
                <p className="text-xs text-gray-500 text-center mt-1">
                  {rows[0].subtitle}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (variant === "ranking") {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
        {header && (
          <div
            className={`p-4 ${headerClassName}`}
            style={{
              backgroundColor: headerBgColor || "#F3F4F6",
            }}
          >
            <h3
              className="font-semibold text-base"
              style={{ color: headerTextColor || "#1F2937" }}
            >
              {header}
            </h3>
          </div>
        )}
        <div className="p-4">
          {rows && rows.length > 0 ? (
            <div className="flex flex-col gap-2">
              {rows.map((row, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors duration-200"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {showRankEmojis && (
                      <span className="text-lg flex-shrink-0">
                        {getRankEmoji(index)}
                      </span>
                    )}
                    <span
                      className={`px-3 py-1.5 rounded-md text-sm font-medium text-white flex-shrink-0 ${titleClassName}`}
                      style={{
                        backgroundColor: row.bgColor || "#6B7280",
                      }}
                    >
                      {row.title}
                    </span>
                  </div>
                  <span
                    className={`text-gray-700 font-semibold text-sm flex-shrink-0 ${valueClassName}`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8 text-sm italic">
              Veri yok
            </p>
          )}
        </div>
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
        {header && (
          <div
            className={`p-4 ${headerClassName}`}
            style={{
              backgroundColor: headerBgColor || "#F3F4F6",
            }}
          >
            <h3
              className="font-semibold text-base"
              style={{ color: headerTextColor || "#1F2937" }}
            >
              {header}
            </h3>
          </div>
        )}
        <div className="p-4">
          {rows && rows.length > 0 ? (
            <div className="flex flex-col gap-0">
              {rows.map((row, index) => (
                <div
                  key={index}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 hover:bg-gray-50 transition-colors duration-200 ${
                    index !== rows.length - 1 ? "border-b border-gray-200" : ""
                  }`}
                >
                  {row.title && (
                    <p
                      className={`text-gray-700 font-medium text-sm flex-1 ${titleClassName}`}
                    >
                      {row.title}
                    </p>
                  )}
                  {row.value && (
                    <div className="flex flex-col items-start sm:items-end gap-1">
                      <p
                        className={`font-bold text-sm ${valueClassName}`}
                        style={{ color: valueColor || "#1F2937" }}
                      >
                        {row.value}
                      </p>
                      {row.subtitle && (
                        <p className="text-gray-500 text-xs">{row.subtitle}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8 text-sm italic">
              Veri yok
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={` flex flex-col border h-max rounded-lg border-gray-200 bg-white w-[98%] mx-auto __className_a182b8 ${
        topClassName ? topClassName : "my-6"
      }`}
    >
      {header && (
        <h1
          className={`font-semibold text-gray-800 px-4 pt-4 ${headerClassName}`}
        >
          {header}
        </h1>
      )}
      <div className="flex flex-col gap-2 px-4 py-6">
        {rows?.map((row, index) => (
          <div
            key={index}
            className={`flex flex-row justify-between ${
              index === rows.length - 1 ? "border-b-0" : "border-b"
            }`}
          >
            {row?.title && (
              <p className={`text-gray-500 ${titleClassName}`}>{row.title}</p>
            )}
            {row?.value && (
              <p className={`text-gray-700 ${valueClassName}`}>{row.value}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SummaryCard;
