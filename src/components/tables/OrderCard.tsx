import { Order, Table } from "../../types";

type Props = {
  order: Order;
  table: Table;
  //   updateOrder: (order: Order) => void;
  //   deleteOrder: (order: Order) => void;
};

const OrderCard = ({ order, table }: Props) => {
  return <div>OrderCard</div>;
};

export default OrderCard;
