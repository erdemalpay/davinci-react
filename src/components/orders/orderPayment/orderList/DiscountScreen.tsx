import { useMemo, useState } from "react";
import { useDataContext } from "../../../../context/Data.context";
import { useOrderContext } from "../../../../context/Order.context";
import {
  MenuItem,
  OrderDiscount,
  OrderDiscountStatus,
  Table,
  TURKISHLIRA,
} from "../../../../types";
import { useGetAllCategories } from "../../../../utils/api/menu/category";
import { useGetOrderDiscounts } from "../../../../utils/api/order/orderDiscount";
import { getItem } from "../../../../utils/getItem";
import OrderScreenHeader from "./OrderScreenHeader";

type Props = {
  table: Table;
  onDiscountSelect: (discount: OrderDiscount) => void;
};

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/i̇/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");

const DiscountScreen = ({ table, onDiscountSelect }: Props) => {
  const categories = useGetAllCategories();
  const { menuItems: items = [] } = useDataContext();
  const { selectedOrders } = useOrderContext();
  const discounts = useGetOrderDiscounts()?.filter(
    (discount) => discount?.status !== OrderDiscountStatus.DELETED
  );
  const [searchTerm, setSearchTerm] = useState("");

  const commonDiscountIds = useMemo(() => {
    const selectedCategoryDiscounts = selectedOrders.map(({ order }) => {
      const itemId =
        typeof order.item === "object"
          ? (order.item as MenuItem)?._id
          : order.item;
      const menuItem = getItem(itemId, items);
      const category = categories?.find(
        (itemCategory) => itemCategory._id === menuItem?.category
      );

      return category?.discounts ?? [];
    });

    if (selectedCategoryDiscounts.length === 0) return new Set<number>();

    const [firstCategoryDiscounts, ...remainingCategoryDiscounts] =
      selectedCategoryDiscounts;

    return new Set(
      firstCategoryDiscounts.filter((discountId) =>
        remainingCategoryDiscounts.every((categoryDiscounts) =>
          categoryDiscounts.includes(discountId)
        )
      )
    );
  }, [categories, items, selectedOrders]);

  const filteredDiscounts = discounts?.filter(
    (discount) =>
      commonDiscountIds.has(discount._id) &&
      (table?.isOnlineSale ? discount?.isOnlineOrder : discount?.isStoreOrder)
  );

  const searchFilteredDiscounts = filteredDiscounts?.filter((discount) => {
    const searchValue = normalizeText(searchTerm);
    return (
      normalizeText(discount?.name).includes(searchValue) ||
      (discount?.percentage &&
        discount?.percentage.toString().includes(searchTerm)) ||
      (discount?.amount && discount?.amount.toString().includes(searchTerm))
    );
  });

  return (
    <div className="flex flex-col relative">
      <OrderScreenHeader header="Discounts" />
      <div className="px-2 mb-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            // Prevent Enter and other keys from bubbling up and triggering parent actions
            if (e.key === "Enter" || e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          autoFocus
          placeholder="İndirim ara..."
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>
      <div className="relative max-h-80">
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />

        <div className="max-h-80 overflow-y-auto px-1 py-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
          <div className="grid grid-cols-3 gap-4">
            {searchFilteredDiscounts?.map((discount) => {
              return (
                <div
                  key={discount?._id}
                  className="flex flex-col justify-start items-center px-2 py-1  pb-2 border rounded-md border-gray-200 hover:bg-gray-100 cursor-pointer h-24 overflow-hidden"
                  onClick={() => {
                    onDiscountSelect(discount);
                  }}
                >
                  <p className="text-red-600 p-2 items-center justify-center  font-medium">
                    {discount?.percentage
                      ? discount?.percentage + "%"
                      : discount?.amount + " " + TURKISHLIRA}
                  </p>
                  <p className="flex flex-row gap-1 text-sm font-medium py-0.5 text-center">
                    {discount?.name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
};

export default DiscountScreen;
