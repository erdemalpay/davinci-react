import { FaRegClock } from "react-icons/fa6";
import { useLocationContext } from "../../context/Location.context";
import { OrderStatus } from "../../types";
import { useGetCategories } from "../../utils/api/menu/category";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { useGetTodayOrders } from "../../utils/api/order/order";
import { getItem } from "../../utils/getItem";
import OrderStatusContainer from "../orders/OrderStatusContainer";

type Props = {
  kitchen: string;
};
const SingleOrdersPage = ({ kitchen }: Props) => {
  const { selectedLocationId } = useLocationContext();
  const categories = useGetCategories();
  const todayOrders = useGetTodayOrders();
  const items = useGetMenuItems();
  if (!todayOrders || !categories || !items) return <></>;
  const filteredOrders = todayOrders?.filter(
    (order) =>
      categories?.find(
        (category) => category?._id === getItem(order?.item, items)?.category
      )?.kitchen === kitchen
  );
  const orderStatusArray = [
    {
      status: "Pending",
      orders: filteredOrders.filter(
        (order) => order.status === OrderStatus.PENDING
      ),
      icon: <FaRegClock size={20} color="white" />,
      iconBackgroundColor: "bg-gradient-to-b from-orange-500 to-yellow-300",
    },
    {
      status: "Ready to Serve",
      orders: filteredOrders.filter(
        (order) => order.status === OrderStatus.READYTOSERVE
      ),
      icon: <FaRegClock size={20} color="white" />,
      iconBackgroundColor: "bg-gradient-to-b from-blue-900 to-blue-500",
    },
    {
      status: "Served",
      orders: filteredOrders.filter(
        (order) => order.status === OrderStatus.SERVED
      ),
      icon: <FaRegClock size={20} color="white" />,
      iconBackgroundColor: "bg-gradient-to-b from-purple-900 to-purple-500",
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-6 mt-3">
        <div className="flex flex-col sm:flex-row gap-8 sm:gap-2 w-[95%] mx-auto">
          {orderStatusArray.map((orderStatus, index) => (
            <div
              key={orderStatus.status + index}
              className="flex flex-col items-center w-full sm:w-1/3"
            >
              <OrderStatusContainer
                status={orderStatus.status}
                orders={orderStatus.orders.filter(
                  (order) => order.location === selectedLocationId
                )}
                icon={orderStatus.icon}
                iconBackgroundColor={orderStatus.iconBackgroundColor}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
export default SingleOrdersPage;
