import { useGetOrderDiscounts } from "../../../../utils/api/order/orderDiscount";
import OrderScreenHeader from "./OrderScreenHeader";

type Props = {};

const DiscountScreen = (props: Props) => {
  const discounts = useGetOrderDiscounts();
  if (!discounts) return null;
  return (
    <div className="flex flex-col h-52 overflow-scroll no-scrollbar  ">
      <OrderScreenHeader header="Discounts" />
      {/* discounts */}
      <div className="grid grid-cols-3 gap-4">
        {discounts.map((discount) => {
          return (
            <div
              key={discount._id}
              className="flex flex-col justify-center items-center px-2 py-1  pb-2 border rounded-md border-gray-200 hover:bg-gray-100 cursor-pointer h-24"
            >
              <p className="text-red-600 p-2 items-center justify-center text-sm font-medium">
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
