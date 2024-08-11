import { MenuItem, Order } from "../../../../types";
import { useGetOrderDiscounts } from "../../../../utils/api/order/orderDiscount";
import OrderScreenHeader from "./OrderScreenHeader";
type Props = {
  tableOrders: Order[];
};
const PaidOrders = ({ tableOrders }: Props) => {
  const discounts = useGetOrderDiscounts();
  if (!discounts) return null;
  const renderPayment = (order: Order) => {
    if (order?.discount) {
      return (
        <p>
          {order?.discountPercentage
            ? order.unitPrice *
              (100 - (order?.discountPercentage ?? 0)) *
              (1 / 100) *
              order.paidQuantity
            : (
                (order.unitPrice - (order?.discountAmount ?? 0)) *
                order.paidQuantity
              ).toFixed(2)}
          ₺
        </p>
      );
    } else {
      return <p>{(order.unitPrice * order.paidQuantity).toFixed(2)}₺</p>;
    }
  };
  return (
    <div className="flex flex-col h-52 overflow-scroll no-scrollbar ">
      <OrderScreenHeader header="Paid Orders" />
      {tableOrders?.map((order) => {
        const isOrderPaid = order.paidQuantity > 1e-6;
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
                {(() => {
                  return Number.isInteger(order.paidQuantity)
                    ? order.paidQuantity
                    : order.paidQuantity.toFixed(2);
                })()}
                {")"}-
              </p>
              <p>{(order.item as MenuItem).name}</p>
            </div>

            {/* buttons */}
            <div className="flex flex-row gap-2 justify-center items-center text-sm font-medium">
              {renderPayment(order)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PaidOrders;
