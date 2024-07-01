import { MenuItem, Order, Table } from "../../types";

type Props = {
  order: Order;
  table: Table;
  //   updateOrder: (order: Order) => void;
  //   deleteOrder: (order: Order) => void;
};

const OrderCard = ({ order, table }: Props) => {
  return (
    <div
      key={order._id}
      className="flex justify-between text-xs cursor-pointer"
      // onClick={() => editorder(order)}
    >
      <div className="flex w-4/5">
        <p>{(order.item as MenuItem).name}</p>
      </div>
    </div>
  );
};

export default OrderCard;
