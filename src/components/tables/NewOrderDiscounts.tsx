import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GenericButton } from "../common/GenericButton";
import { useOrderContext } from "../../context/Order.context";
import { OrderDiscount, OrderDiscountStatus, TURKISHLIRA } from "../../types";
import { useGetPopularDiscounts } from "../../utils/api/order/order";
import { useGetOrderDiscounts } from "../../utils/api/order/orderDiscount";
import SearchInput from "../panelComponents/common/SearchInput";

const NewOrderDiscounts = () => {
  const { t } = useTranslation();
  const discounts = useGetOrderDiscounts()?.filter(
    (discount) => discount?.status !== OrderDiscountStatus.DELETED
  );
  const popularDiscounts = useGetPopularDiscounts();
  const [showAllDiscounts, setShowAllDiscounts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const {
    orderCreateBulk,
    selectedNewOrders,
    setSelectedDiscount,
    setIsDiscountNoteOpen,
    setIsProductSelectionOpen,
  } = useOrderContext();
  const handleDiscountClick = (discount: OrderDiscount) => {
    setSelectedDiscount(discount);

    if (discount?.isNoteRequired) {
      setIsDiscountNoteOpen(true);
      return;
    }

    setIsProductSelectionOpen(true);
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
        ?.flat()
    )
  );

  const filteredDiscounts = discounts?.filter((discount) => {
    if (!discount?.isStoreOrder) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      const matchesName = discount?.name?.toLowerCase().includes(query);
      const matchesAmount = discount?.amount?.toString().includes(query);
      const matchesPercentage = discount?.percentage
        ?.toString()
        .includes(query);
      return matchesName || matchesAmount || matchesPercentage;
    }

    return (
      filteredPopularDiscounts?.length === 0 ||
      filteredPopularDiscounts?.includes(discount._id) ||
      showAllDiscounts
    );
  });
  return (
    <div className="flex flex-col h-[60%] sm:h-full overflow-y-auto no-scrollbar px-2 pb-2 sm:min-h-[23rem]">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center justify-between mb-3 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t("Search Discounts")}
          />
        </div>

        <button
          onClick={() => {
            setShowAllDiscounts(!showAllDiscounts);
          }}
          className="inline-block bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-md cursor-pointer whitespace-nowrap"
        >
          {showAllDiscounts
            ? t("Show Popular Discounts")
            : t("Show All Discounts")}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 auto-rows-min content-start">
        {filteredDiscounts?.map((discount) => {
          return (
            <div
              key={discount._id}
              className="flex flex-col justify-center items-center px-3 py-3 border-2 rounded-lg border-gray-200 hover:border-blue-400 hover:shadow-md cursor-pointer min-h-[100px] sm:min-h-[120px] transition-all duration-200 bg-white"
              onClick={() => {
                handleDiscountClick(discount);
              }}
            >
              <p className="text-red-600 text-lg sm:text-xl font-bold mb-1">
                {discount?.percentage
                  ? discount.percentage + "%"
                  : discount.amount + " " + TURKISHLIRA}
              </p>
              <p className="text-xs sm:text-sm font-medium text-center text-gray-700 line-clamp-2">
                {discount.name}
              </p>
            </div>
          );
        })}

        {filteredDiscounts?.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-8">
            {searchQuery
              ? t("No discounts found for your search")
              : t("No discounts available")}
          </div>
        )}
      </div>

      <div className="flex flex-row items-center ml-auto gap-2 mt-2 ">
        <GenericButton
          onClick={() => {
            setShowAllDiscounts(!showAllDiscounts);
          }}
          variant="primary"
          size="sm"
        >
          {showAllDiscounts
            ? t("Show Popular Discounts")
            : t("Show All Discounts")}
        </GenericButton>
      </div>
    </div>
  );
};

export default NewOrderDiscounts;
