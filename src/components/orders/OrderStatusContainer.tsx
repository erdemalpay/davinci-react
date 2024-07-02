import { useTranslation } from "react-i18next";
import { Order } from "../../types";

type Props = {
  status: string;
  orders: Order[];
  icon: React.ReactNode;
  iconBackgroundColor: string;
};

const OrderStatusContainer = ({
  status,
  orders,
  icon,
  iconBackgroundColor,
}: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full relative border border-gray-200 rounded-lg bg-white shadow-sm __className_a182b8 mx-auto h-screen">
      <div
        className={`absolute left-3 top-[-1.5rem] px-4 py-4 border ${iconBackgroundColor}`}
      >
        {icon}
      </div>
      <div className="flex flex-col gap-12 mt-2">
        {/* status */}
        <div className=" w-5/6 flex ml-auto">
          <div className="flex gap-0.5">
            <h1 className="font-medium">{t(status)}</h1>
            <h1 className="font-medium">
              {"("}
              {orders.length}
              {")"}
            </h1>
          </div>
        </div>
        {/* orders */}
      </div>
    </div>
  );
};

export default OrderStatusContainer;
