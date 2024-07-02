import { FaRegClock } from "react-icons/fa6";
import { Header } from "../components/header/Header";
import OrderStatusContainer from "../components/orders/OrderStatusContainer";
import { OrderStatus } from "../types";
import { useGetTodayOrders } from "../utils/api/order/order";

export default function Orders() {
  const todayOrders = useGetTodayOrders();
  if (!todayOrders) return <></>;
  const orderStatusArray = [
    {
      status: "Pending",
      orders: todayOrders.filter(
        (order) => order.status === OrderStatus.PENDING
      ),
      icon: <FaRegClock size={20} color="white" />,
      iconBackgroundColor: "bg-gradient-to-b from-orange-500 to-yellow-300",
    },
    {
      status: "Ready to Serve",
      orders: todayOrders.filter(
        (order) => order.status === OrderStatus.READYTOSERVE
      ),
      icon: <FaRegClock size={20} color="white" />,
      iconBackgroundColor: "bg-gradient-to-b from-blue-900 to-blue-500",
    },
    {
      status: "Served",
      orders: todayOrders.filter(
        (order) => order.status === OrderStatus.SERVED
      ),
      icon: <FaRegClock size={20} color="white" />,
      iconBackgroundColor: "bg-gradient-to-b from-purple-900 to-purple-500",
    },
  ];
  return (
    <>
      <Header />
      <div className="mt-16 flex flex-col  sm:flex-row gap-8 sm:gap-2 w-[95%] mx-auto">
        {orderStatusArray.map((orderStatus, index) => (
          <div
            key={orderStatus.status + index}
            className="flex flex-col items-center w-full sm:w-1/3"
          >
            <OrderStatusContainer
              status={orderStatus.status}
              orders={orderStatus.orders}
              icon={orderStatus.icon}
              iconBackgroundColor={orderStatus.iconBackgroundColor}
            />
          </div>
        ))}
      </div>
    </>
  );
}
