import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../context/Order.context";
import { OrderDiscount, OrderDiscountStatus, TURKISHLIRA } from "../../types";
import { useGetPopularDiscounts } from "../../utils/api/order/order";
import { useGetOrderDiscounts } from "../../utils/api/order/orderDiscount";

const NewOrderDiscounts = () => {
  const { t } = useTranslation();
  const discounts = useGetOrderDiscounts()?.filter(
    (discount) => discount?.status !== OrderDiscountStatus.DELETED
  );
  const popularDiscounts = useGetPopularDiscounts();
  const [showAllDiscounts, setShowAllDiscounts] = useState(false);
  const {
    orderCreateBulk,
    setOrderCreateBulk,
    isNewOrderDiscountScreenOpen,
    setIsNewOrderDiscountScreenOpen,
    selectedNewOrders,
  } = useOrderContext();
  if (!discounts || !popularDiscounts) return null;
  const handleDiscountClick = (discount: OrderDiscount) => {
    if (!isNewOrderDiscountScreenOpen) {
      setIsNewOrderDiscountScreenOpen(true);
    }
    const newOrders = orderCreateBulk?.map((order, index) => {
      if (selectedNewOrders?.includes(index)) {
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

  const selectedOrders = orderCreateBulk?.filter((order, index) =>
    selectedNewOrders?.includes(index)
  );
  const filteredPopularDiscounts = Array.from(
    new Set(
      selectedOrders
        ?.map(
          (o) =>
            popularDiscounts?.find((pd) => pd.item === o.item)?.discounts ?? []
        )
        .flat()
    )
  );
  const filteredDiscounts = discounts?.filter((discount) => {
    return (
      discount?.isStoreOrder &&
      (filteredPopularDiscounts?.length === 0 ||
        filteredPopularDiscounts?.includes(discount._id) ||
        showAllDiscounts)
    );
  });
  return (
    <div className="flex flex-col h-[60%] overflow-scroll no-scrollbar px-2 pb-2  ">
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

      <div className="flex flex-row items-center ml-auto gap-2 mt-2">
        <button
          onClick={() => {
            setShowAllDiscounts(!showAllDiscounts);
          }}
          className={`inline-block bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-md cursor-pointer  w-fit`}
        >
          {showAllDiscounts
            ? t("Show Popular Discounts")
            : t("Show All Discounts")}
        </button>
        <button
          onClick={() => {
            setIsNewOrderDiscountScreenOpen(false);
          }}
          className={`inline-block bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-md cursor-pointer  w-fit`}
        >
          {t("Back")}
        </button>
      </div>
    </div>
  );
};

export default NewOrderDiscounts;
