import { useOrderContext } from "../../../../context/Order.context";
import {
  Order,
  OrderDiscount,
  OrderDiscountStatus,
  Table,
  TURKISHLIRA,
} from "../../../../types";
import { useGetOrderDiscounts } from "../../../../utils/api/order/orderDiscount";
import OrderScreenHeader from "./OrderScreenHeader";

type Props = {
  table: Table;
  tableOrders: Order[];
};

const DiscountScreen = ({ tableOrders, table }: Props) => {
  const discounts = useGetOrderDiscounts()?.filter(
    (discount) => discount?.status !== OrderDiscountStatus.DELETED
  );
  const {
    setIsProductSelectionOpen,
    setSelectedDiscount,
    setIsDiscountNoteOpen,
  } = useOrderContext();
  if (!discounts || !tableOrders) return null;
  const handleDiscountClick = (discount: OrderDiscount) => {
    setSelectedDiscount(discount);
    if (discount?.isNoteRequired) {
      setIsDiscountNoteOpen(true);
      return;
    }
    setIsProductSelectionOpen(true);
  };
  const filteredDiscounts = discounts?.filter((discount) =>
    table?.isOnlineSale ? discount?.isOnlineOrder : !discount?.isOnlineOrder
  );
  return (
    <div className="flex flex-col h-[60%] overflow-scroll no-scrollbar  ">
      <OrderScreenHeader header="Discounts" />
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

export default DiscountScreen;
