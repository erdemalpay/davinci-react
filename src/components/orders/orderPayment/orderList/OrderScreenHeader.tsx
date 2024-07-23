import { useTranslation } from "react-i18next";

type Props = {
  header: string;
};

const OrderScreenHeader = ({ header }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="relative text-center py-2 mb-2 sticky top-0 bg-white">
      <h1 className="relative z-10 bg-blue-gray-50 px-3 py-1 rounded-full inline-block mx-1">
        {t(header)}
      </h1>
      <div className="absolute w-full h-[0.2px] bg-blue-gray-200 top-1/2 transform -translate-y-1/2"></div>
    </div>
  );
};

export default OrderScreenHeader;
