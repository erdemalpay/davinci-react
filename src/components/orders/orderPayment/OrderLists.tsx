import { useTranslation } from "react-i18next";
import { MdOutlineTouchApp } from "react-icons/md";
import { PiArrowArcLeftBold } from "react-icons/pi";
import { MenuItem } from "../../../types";
import { useGetTodayOrders } from "../../../utils/api/order/order";

type Props = {};

const OrderLists = (props: Props) => {
  const { t } = useTranslation();
  const orders = useGetTodayOrders();
  return (
    <div className="flex flex-col border border-gray-200 rounded-md bg-white shadow-lg p-1 gap-4 __className_a182b8">
      {/*main header part */}
      <div className="flex flex-row justify-between border-b border-gray-200 items-center pb-1 font-semibold px-2 py-1">
        <h1>{t("Pay in Parts")}</h1>
        <p>0.00₺</p>
      </div>
      {/* unpaid orders */}
      <div className="flex flex-col h-52 overflow-scroll no-scrollbar ">
        {/* header */}
        <div className="relative text-center py-2 mb-2 sticky top-0 bg-white">
          <h1 className="relative z-10 bg-blue-gray-50 px-3 py-1 rounded-full inline-block mx-1">
            {t("Unpaid Orders")}
          </h1>
          <div className="absolute w-full h-[0.2px] bg-blue-gray-200 top-1/2 transform -translate-y-1/2"></div>
        </div>
        {/* orders */}
        {orders?.map((order) => (
          <div
            key={order._id}
            className="flex flex-row justify-between items-center px-2 py-1  pb-2 border-b border-gray-200"
          >
            {/* item name,quantity part */}
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex flex-row gap-1 text-sm font-medium">
                <p>
                  {"("}
                  {order.quantity}
                  {")"}-
                </p>
                <p>{(order.item as MenuItem).name}</p>
              </div>
              {/* paid unpaid amounts */}
              <div className="flex flex-row gap-2 text-[10px] text-gray-500">
                <p>{t("Paid")}: 0.00₺</p>
                <p>{t("Unpaid")}: 40.00₺</p>
              </div>
            </div>
            {/* buttons */}
            <div className="flex flex-row gap-2 justify-center items-center text-sm font-medium">
              <p>{order.totalPrice}₺</p>
              <MdOutlineTouchApp className="cursor-pointer hover:text-red-600 text-lg" />
            </div>
          </div>
        ))}
      </div>
      {/* paid orders */}
      <div className="flex flex-col h-52 overflow-scroll no-scrollbar ">
        {/* header */}
        <div className="relative text-center py-2 mb-2 sticky top-0 bg-white">
          <h1 className="relative z-10 bg-blue-gray-50 px-3 py-1 rounded-full inline-block mx-1">
            {t("Paid Orders")}
          </h1>
          <div className="absolute w-full h-[0.2px] bg-blue-gray-200 top-1/2 transform -translate-y-1/2"></div>
        </div>
        {/* orders */}
        {orders?.map((order) => (
          <div
            key={order._id}
            className="flex flex-row justify-between items-center px-2 py-1  pb-2 border-b border-gray-200"
          >
            {/* item name,quantity part */}
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex flex-row gap-1 text-sm font-medium">
                <p>
                  {"("}
                  {order.quantity}
                  {")"}-
                </p>
                <p>{(order.item as MenuItem).name}</p>
              </div>
              {/* paid unpaid amounts */}
              <div className="flex flex-row gap-2 text-[10px] text-gray-500">
                <p>{t("Paid")}: 0.00₺</p>
                <p>{t("Unpaid")}: 40.00₺</p>
              </div>
            </div>
            {/* buttons */}
            <div className="flex flex-row gap-2 justify-center items-center text-sm font-medium">
              <p>{order.totalPrice}₺</p>
              <PiArrowArcLeftBold className="cursor-pointer text-red-600 text-lg" />
            </div>
          </div>
        ))}
      </div>
      {/* buttons */}
      <div className="mt-4 ml-auto">
        <button className="w-fit bg-gray-100 p-3 rounded-lg focus:outline-none  hover:bg-gray-200 text-red-300 hover:text-red-500 font-semibold">
          {t("Pay All")}
        </button>
      </div>
    </div>
  );
};

export default OrderLists;
