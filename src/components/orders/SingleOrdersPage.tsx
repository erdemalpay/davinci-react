import { FaRegClock } from "react-icons/fa6";
import { MdOutlineRestaurantMenu } from "react-icons/md";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { useLocationContext } from "../../context/Location.context";
import { Kitchen, Order, OrderStatus } from "../../types";
import { useGetAllCategories } from "../../utils/api/menu/category";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { getItem } from "../../utils/getItem";
import OrderStatusContainer from "../orders/OrderStatusContainer";

type Props = {
  kitchen: Kitchen;
  orders: Order[];
};
const SingleOrdersPage = ({ kitchen, orders }: Props) => {
  const { selectedLocationId } = useLocationContext();
  const categories = useGetAllCategories();
  const items = useGetMenuItems();
  if (!orders || !categories || !items) return <></>;
  const filteredOrders = orders?.filter(
    (order) =>
      categories?.find(
        (category) => category?._id === getItem(order?.item, items)?.category
      )?.kitchen === kitchen._id
  );
  const orderStatusArray = [
    {
      status: "Confirmation Waiting",
      orders: filteredOrders.filter(
        (order) => order.status === OrderStatus.CONFIRMATIONREQ
      ),
      icon: <FaRegClock size={20} color="white" />,
      iconBackgroundColor: "bg-gradient-to-b from-orange-500 to-yellow-300",
      isDisabled: !kitchen?.isConfirmationRequired,
    },
    {
      status: "Pending",
      orders: filteredOrders.filter(
        (order) => order.status === OrderStatus.PENDING
      ),
      icon: <FaRegClock size={20} color="white" />,
      iconBackgroundColor: "bg-gradient-to-b from-orange-500 to-yellow-300",
    },
    {
      status: kitchen?.isConfirmationRequired ? "On the Way" : "Ready to Serve",
      orders: filteredOrders.filter(
        (order) => order.status === OrderStatus.READYTOSERVE
      ),
      icon: <MdOutlineRestaurantMenu size={20} color="white" />,
      iconBackgroundColor: "bg-gradient-to-b from-blue-900 to-blue-500",
    },
    {
      status: "Served",
      orders: filteredOrders.filter(
        (order) => order.status === OrderStatus.SERVED
      ),
      icon: <IoMdCheckmarkCircleOutline size={20} color="white" />,
      iconBackgroundColor: "bg-gradient-to-b from-green-700 to-green-400",
    },
  ];
  return (
    <>
      <div className="flex flex-col gap-6 mt-3">
        <div className="flex flex-col sm:flex-row gap-8 sm:gap-2 w-[95%] mx-auto">
          {orderStatusArray
            .filter((orderStatus) => !orderStatus?.isDisabled)
            .map((orderStatus, index) => (
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
                  kitchen={kitchen}
                />
              </div>
            ))}
        </div>
      </div>
    </>
  );
};
export default SingleOrdersPage;
