import { useOrderContext } from "../../../../context/Order.context";
import { Order, OrderDiscount, TURKISHLIRA } from "../../../../types";
import { useGetOrderDiscounts } from "../../../../utils/api/order/orderDiscount";
import OrderScreenHeader from "./OrderScreenHeader";

type Props = {
  tableOrders: Order[];
};

const DiscountScreen = ({ tableOrders }: Props) => {
  const discounts = useGetOrderDiscounts();
  const { setIsProductSelectionOpen, setSelectedDiscount } = useOrderContext();
  if (!discounts || !tableOrders) return null;
  const handleDiscountClick = (discount: OrderDiscount) => {
    setSelectedDiscount(discount);
    setIsProductSelectionOpen(true);
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

export default DiscountScreen;
