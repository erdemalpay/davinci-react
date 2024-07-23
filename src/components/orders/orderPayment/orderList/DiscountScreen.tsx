import { useGetOrderDiscounts } from "../../../../utils/api/order/orderDiscount";
import OrderScreenHeader from "./OrderScreenHeader";

type Props = {};

const DiscountScreen = (props: Props) => {
  const discounts = useGetOrderDiscounts();
  if (!discounts) return null;
  return (
    <div className="flex flex-col h-52 overflow-scroll no-scrollbar  ">
      {/* header */}
      <OrderScreenHeader header="Discounts" />
    </div>
  );
};

export default DiscountScreen;
