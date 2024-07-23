import { GrCheckbox, GrCheckboxSelected } from "react-icons/gr";
import { useOrderContext } from "../../../../context/Order.context";
import { MenuItem, OrderPayment } from "../../../../types";
import { useGetGivenDateOrders } from "../../../../utils/api/order/order";
import OrderScreenHeader from "./OrderScreenHeader";

type Props = {
  orderPayment: OrderPayment;
};

const OrderSelect = ({ orderPayment }: Props) => {
  const orders = useGetGivenDateOrders();
  const { temporaryOrders, selectedOrders, setSelectedOrders } =
    useOrderContext();
  return (
    <div className="flex flex-col h-52 overflow-scroll no-scrollbar  ">
      <OrderScreenHeader header="Select Order" />
      {/* orders */}
      {orderPayment?.orders?.map((orderPaymentItem) => {
        const order = orders.find(
          (order) => order._id === orderPaymentItem.order
        );
        const isAllPaid =
          orderPaymentItem.paidQuantity === orderPaymentItem.totalQuantity;
        if (!order || isAllPaid) return null;
        const tempOrder = temporaryOrders.find(
          (tempOrder) => tempOrder.order._id === order._id
        );
        const isAllPaidWithTempOrder =
          orderPaymentItem.paidQuantity + (tempOrder?.quantity ?? 0) ===
          orderPaymentItem.totalQuantity;
        if (isAllPaidWithTempOrder) return null;
        return (
          <div
            key={order._id}
            className="flex flex-row justify-between items-center px-2 py-1  pb-2 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              if (selectedOrders.includes(order._id)) {
                setSelectedOrders(
                  selectedOrders.filter((id) => id !== order._id)
                );
              } else {
                setSelectedOrders([...selectedOrders, order._id]);
              }
            }}
          >
            {/* item name,quantity part */}
            <div className="flex flex-row gap-1 items-center justify-center  text-sm font-medium py-0.5">
              {selectedOrders.includes(order._id) ? (
                <GrCheckboxSelected className="w-4 h-4 mr-2 " />
              ) : (
                <GrCheckbox className="w-4 h-4 mr-2 " />
              )}
              <p>
                {"("}
                {orderPaymentItem.totalQuantity -
                  (orderPaymentItem.paidQuantity + (tempOrder?.quantity ?? 0))}
                {")"}-
              </p>
              <p>{(order.item as MenuItem).name}</p>
            </div>
            {/* buttons */}
            <div className="flex flex-row gap-2 justify-center items-center text-sm font-medium">
              <p>
                {order.unitPrice *
                  (orderPaymentItem.totalQuantity -
                    (orderPaymentItem.paidQuantity +
                      (tempOrder?.quantity ?? 0)))}
                ₺
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderSelect;
