import { MenuItem, OrderPayment } from "../../../../types";
import { useGetGivenDateOrders } from "../../../../utils/api/order/order";
import { useGetOrderDiscounts } from "../../../../utils/api/order/orderDiscount";
import OrderScreenHeader from "./OrderScreenHeader";

type Props = {
  orderPayment: OrderPayment;
};
const PaidOrders = ({ orderPayment }: Props) => {
  const orders = useGetGivenDateOrders();
  const discounts = useGetOrderDiscounts();
  if (!orderPayment || !orders || !discounts) return null;

  return (
    <div className="flex flex-col h-52 overflow-scroll no-scrollbar ">
      <OrderScreenHeader header="Paid Orders" />
      {orderPayment?.orders?.map((orderPaymentItem) => {
        const order = orders.find(
          (order) => order._id === orderPaymentItem.order
        );
        const isOrderPaid = orderPaymentItem.paidQuantity !== 0;
        if (!order || !isOrderPaid) return null;
        return (
          <div
            key={order._id}
            className="flex flex-row justify-between items-center px-2 py-1  pb-2 border-b border-gray-200"
          >
            {/* item name,quantity part */}

            <div className="flex flex-row gap-1 text-sm font-medium py-0.5">
              <p>
                {"("}
                {orderPaymentItem.paidQuantity}
                {")"}-
              </p>
              <p>{(order.item as MenuItem).name}</p>
            </div>

            {/* buttons */}
            <div className="flex flex-row gap-2 justify-center items-center text-sm font-medium">
              <p>{order.unitPrice * orderPaymentItem.paidQuantity}₺</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PaidOrders;
