import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const {
    temporaryOrders,
    selectedOrders,
    setSelectedOrders,
    isSelectAll,
    setIsSelectAll,
  } = useOrderContext();
  return (
    <div className="flex flex-col h-52 overflow-scroll no-scrollbar  ">
      <OrderScreenHeader header="Select Order" />
      {/* select all */}

      <div
        className="ml-2 mr-auto flex flex-row gap-2 justify-start items-center  w-full pb-2 border-b border-gray-200 hover:bg-gray-100 cursor-pointer "
        onClick={() => {
          if (isSelectAll) {
            setIsSelectAll(false);
            setSelectedOrders([]);
          } else {
            setIsSelectAll(true);
            setSelectedOrders(
              orders.map((order) => {
                const foundOrderPayment = orderPayment?.orders?.find(
                  (paymentItem) => paymentItem.order === order._id
                );
                return {
                  order: order,
                  totalQuantity: foundOrderPayment?.totalQuantity ?? 0,
                  selectedQuantity:
                    (foundOrderPayment?.totalQuantity ?? 0) -
                    (foundOrderPayment?.paidQuantity ?? 0),
                };
              })
            );
          }
        }}
      >
        {isSelectAll ? (
          <GrCheckboxSelected className="w-4 h-4  " />
        ) : (
          <GrCheckbox className="w-4 h-4   " />
        )}
        <p>{t("All")}</p>
      </div>

      {/* orders */}
      {orderPayment?.orders
        ?.filter((orderPaymentItem) => !orderPaymentItem.discount)
        ?.map((orderPaymentItem) => {
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
                const foundOrder = selectedOrders.find(
                  (item) => item.order._id === order._id
                );
                if (foundOrder) {
                  if (foundOrder.totalQuantity > foundOrder.selectedQuantity) {
                    setSelectedOrders([
                      ...selectedOrders.filter(
                        (item) => item.order._id !== order._id
                      ),
                      {
                        order: order,
                        totalQuantity: order.quantity,
                        selectedQuantity: foundOrder.selectedQuantity + 1,
                      },
                    ]);
                  } else {
                    setSelectedOrders([
                      ...selectedOrders.filter(
                        (item) => item.order._id !== order._id
                      ),
                    ]);
                  }
                } else {
                  setSelectedOrders([
                    ...selectedOrders,
                    {
                      order: order,
                      totalQuantity: order.quantity,
                      selectedQuantity: 1,
                    },
                  ]);
                }
              }}
            >
              {/* item name,quantity part */}
              <div className="flex flex-row gap-1 items-center justify-center  text-sm font-medium py-0.5">
                <p className="p-1 border border-black  w-5 h-5 items-center justify-center flex text-sm text-red-600 font-medium">
                  {selectedOrders.find((item) => item.order._id === order._id)
                    ?.selectedQuantity ?? ""}
                </p>
                <p>
                  {"("}
                  {orderPaymentItem.totalQuantity -
                    (orderPaymentItem.paidQuantity +
                      (tempOrder?.quantity ?? 0))}
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
