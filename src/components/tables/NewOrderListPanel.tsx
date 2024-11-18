import { FiMinusCircle } from "react-icons/fi";
import { GoPlusCircle } from "react-icons/go";
import { useOrderContext } from "../../context/Order.context";
import { Order } from "../../types";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { getItem } from "../../utils/getItem";

type Props = {
  orders: Partial<Order>[];
};

const NewOrderListPanel = ({ orders }: Props) => {
  const items = useGetMenuItems();
  if (!items) return null;
  const { orderCreateBulk, setOrderCreateBulk } = useOrderContext();
  return (
    <div className="flex flex-col gap-1 px-2 text-sm ">
      {orders?.map((order, index) => {
        const orderItem = getItem(order.item, items);
        return (
          <div key={index} className="rounded-lg px-2 py-1 bg-yellow-200">
            <div className="flex flex-row gap-2  items-center  ">
              {/* decrement */}
              <FiMinusCircle
                className="w-5 h-5 flex-shrink-0  text-red-500  hover:text-red-800 cursor-pointer focus:outline-none"
                onClick={() => {
                  if (!order.quantity) return;
                  if (order.quantity === 1) {
                    const newOrders = [...orderCreateBulk];
                    newOrders.splice(index, 1);
                    setOrderCreateBulk(newOrders);
                    return;
                  } else {
                    const newOrders = [...orderCreateBulk];
                    newOrders[index].quantity = order.quantity - 1;
                    setOrderCreateBulk(newOrders);
                  }
                }}
              />
              {/* name and quantity */}
              <div className="flex w-5/6 gap-1 items-center ">
                <p>{orderItem?.name}</p>
                <h1 className="text-xs">({order.quantity})</h1>
              </div>
              <GoPlusCircle
                className="w-5 h-5 flex-shrink-0  text-green-500  hover:text-green-800 cursor-pointer focus:outline-none"
                onClick={() => {
                  if (!order.quantity) return;
                  const newOrders = [...orderCreateBulk];
                  newOrders[index].quantity = order.quantity + 1;
                  setOrderCreateBulk(newOrders);
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NewOrderListPanel;
