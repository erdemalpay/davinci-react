import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useOrderContext } from "../../../../context/Order.context";
import { OrderDiscount, OrderPayment } from "../../../../types";
import { useGetGivenDateOrders } from "../../../../utils/api/order/order";
import { useGetOrderDiscounts } from "../../../../utils/api/order/orderDiscount";
import { useOrderPaymentMutations } from "../../../../utils/api/order/orderPayment";
import OrderScreenHeader from "./OrderScreenHeader";

type Props = {
  orderPayment: OrderPayment;
};

const DiscountScreen = ({ orderPayment }: Props) => {
  const { t } = useTranslation();
  const discounts = useGetOrderDiscounts();
  const { updateOrderPayment } = useOrderPaymentMutations();
  const orders = useGetGivenDateOrders();
  const {
    selectedOrders,
    setSelectedOrders,
    setIsDiscountScreenOpen,
    setIsProductSelectionOpen,
    setIsSelectAll,
  } = useOrderContext();
  if (!discounts || !orderPayment) return null;
  const handleDiscountClick = (discount: OrderDiscount) => {
    if (selectedOrders.length === 0) {
      toast.error(t("Please select orders first"));
      setIsDiscountScreenOpen(false);
      return;
    }
    const newOrders = orderPayment?.orders?.map((orderPaymentItem) => {
      if (selectedOrders.includes(orderPaymentItem.order)) {
        return {
          ...orderPaymentItem,
          discount: discount._id,
          discountPercentage: discount.percentage,
          discountQuantity:
            orderPaymentItem.totalQuantity - orderPaymentItem.paidQuantity,
        };
      }
      return orderPaymentItem;
    });
    const totalDiscount = newOrders?.reduce((acc, orderPaymentItem) => {
      const order = orders.find(
        (order) => order._id === orderPaymentItem.order
      );
      if (!order) return acc;
      if (orderPaymentItem?.discountQuantity) {
        return (
          acc +
          (order?.unitPrice *
            (orderPaymentItem.discountPercentage ?? 0) *
            orderPaymentItem.discountQuantity) /
            100
        );
      }
      return acc;
    }, 0);
    updateOrderPayment({
      id: orderPayment._id,
      updates: {
        orders: newOrders,
        discountAmount: totalDiscount,
      },
    });
    setSelectedOrders([]);
    setIsDiscountScreenOpen(false);
    setIsProductSelectionOpen(false);
    setIsSelectAll(false);
  };

  return (
    <div className="flex flex-col h-52 overflow-scroll no-scrollbar  ">
      <OrderScreenHeader header="Discounts" />
      {/* discounts */}
      <div className="grid grid-cols-3 gap-4">
        {discounts.map((discount) => {
          return (
            <div
              key={discount._id}
              className="flex flex-col justify-start items-center px-2 py-1  pb-2 border rounded-md border-gray-200 hover:bg-gray-100 cursor-pointer h-24"
              onClick={() => {
                handleDiscountClick(discount);
              }}
            >
              <p className="text-red-600 p-2 items-center justify-center  font-medium">
                {discount.percentage}%
              </p>
              <p className="flex flex-row gap-1 text-sm font-medium py-0.5 text-center">
                {discount.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DiscountScreen;
