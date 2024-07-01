import { HiOutlineTrash } from "react-icons/hi2";
import { PiBellRinging, PiBellSimpleRingingFill } from "react-icons/pi";
import { useUserContext } from "../../context/User.context";
import { MenuItem, Order, OrderStatus, Table, User } from "../../types";
import { useOrderMutations } from "../../utils/api/order/order";

type Props = {
  order: Order;
  table: Table;
};

const OrderCard = ({ order, table }: Props) => {
  const { deleteOrder, updateOrder } = useOrderMutations();
  const { user } = useUserContext();
  if (!user) return <></>;
  const orderBgColor = () => {
    switch (order.status) {
      case OrderStatus.PENDING:
        return "bg-blue-200";
      case OrderStatus.READYTOSERVE:
        return "bg-yellow-200";
      case OrderStatus.SERVED:
        return "bg-green-200";
      default:
        return "bg-gray-200";
    }
  };
  const orderWaitTime = () => {
    const orderTime = new Date(order.createdAt).getTime();
    const currentTime = new Date().getTime();
    return Math.floor((currentTime - orderTime) / 60000);
  };
  const orderServeUpdate = () => {
    if (order.status === OrderStatus.READYTOSERVE) {
      updateOrder({
        id: order._id,
        updates: {
          status: OrderStatus.SERVED,
          deliveredBy: user._id,
          deliveredAt: new Date(),
        },
      });
    } else if (order.status === OrderStatus.SERVED) {
      updateOrder({
        id: order._id,
        updates: { status: OrderStatus.READYTOSERVE },
      });
    }
  };
  return (
    <div
      key={order._id}
      className={`flex justify-between text-xs  rounded-lg items-center px-2 py-1 ${orderBgColor()}`}
      // onClick={() => editorder(order)}
    >
      <div className="flex w-5/6 gap-1">
        <p>{(order.item as MenuItem).name} </p>
        <h1 className="text-xs">({order.quantity})</h1>
      </div>

      <div className="flex flex-row ">
        {order.status !== OrderStatus.PENDING &&
          (order.status === OrderStatus.READYTOSERVE ? (
            <PiBellSimpleRingingFill
              className="text-green-500 cursor-pointer text-lg px-[0.5px]"
              onClick={orderServeUpdate}
            />
          ) : (
            user._id === (order.deliveredBy as User)._id && (
              <PiBellRinging
                className="text-yellow-500 cursor-pointer text-lg px-[0.5px]"
                onClick={orderServeUpdate}
              />
            )
          ))}
        {order.status === OrderStatus.PENDING && (
          <div className="flex flex-row gap-[1px]">
            <h5 className="text-xs whitespace-nowrap min-w-8">
              {orderWaitTime()} m
            </h5>

            <HiOutlineTrash
              className="text-red-500 cursor-pointer text-lg px-[0.5px]"
              onClick={() => deleteOrder(order._id)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
