import { useOrderContext } from "../../context/Order.context";
import { OrderDiscount, OrderDiscountStatus, TURKISHLIRA } from "../../types";
import { useGetOrderDiscounts } from "../../utils/api/order/orderDiscount";

const NewOrderDiscounts = () => {
  const discounts = useGetOrderDiscounts()?.filter(
    (discount) => discount?.status !== OrderDiscountStatus.DELETED
  );
  const {
    orderCreateBulk,
    setOrderCreateBulk,
    isNewOrderDiscountScreenOpen,
    setIsNewOrderDiscountScreenOpen,
    selectedNewOrders,
  } = useOrderContext();
  if (!discounts) return null;
  const handleDiscountClick = (discount: OrderDiscount) => {
    if (!isNewOrderDiscountScreenOpen) {
      setIsNewOrderDiscountScreenOpen(true);
    }
    const newOrders = orderCreateBulk.map((order, index) => {
      if (selectedNewOrders.includes(index)) {
        return {
          ...order,
          discount: discount._id,
        };
      }
      return order;
    });
    setOrderCreateBulk(newOrders);
    setIsNewOrderDiscountScreenOpen(false);
  };
  const filteredDiscounts = discounts?.filter((discount) => {
    return discount?.isStoreOrder;
  });
  return (
    <div className="flex flex-col h-[60%] overflow-scroll no-scrollbar  ">
      {/* discounts */}
      <div className="grid grid-cols-3 gap-4">
        {filteredDiscounts?.map((discount) => {
          return (
            <div
              key={discount._id}
              className="flex flex-col justify-start items-center px-2 py-1  pb-2 border rounded-md border-gray-200 hover:bg-gray-100 cursor-pointer h-24 overflow-scroll no-scrollbar"
              onClick={() => {
                handleDiscountClick(discount);
              }}
            >
              <p className="text-red-600 p-2 items-center justify-center  font-medium">
                {discount?.percentage
                  ? discount.percentage + "%"
                  : discount.amount + " " + TURKISHLIRA}
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

export default NewOrderDiscounts;
