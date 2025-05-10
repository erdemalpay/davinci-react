type Props = {
  header?: string;
  headerClassName?: string;
  rows?: {
    title?: string;
    value?: string;
  }[];
  titleClassName?: string;
  valueClassName?: string;
  topClassName?: string;
};

const SummaryCard = ({
  header,
  headerClassName,
  rows,
  titleClassName,
  valueClassName,
  topClassName,
}: Props) => {
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
