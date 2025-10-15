import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../context/Order.context";
import { Order } from "../../types";
import { useGetCategories } from "../../utils/api/menu/category";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { getItem } from "../../utils/getItem";
import OrderScreenHeader from "../orders/orderPayment/orderList/OrderScreenHeader";

const NewOrderProductSelect = () => {
  const { t } = useTranslation();
  const categories = useGetCategories();
  const items = useGetMenuItems();
  const {
    orderCreateBulk,
    selectedNewOrders,
    selectedOrders,
    setSelectedOrders,
    selectedDiscount,
  } = useOrderContext();

  if (!categories) return <></>;

  const selectedOrdersFromBulk = orderCreateBulk
    ?.map((order, index) => ({ ...order, bulkIndex: index }))
    .filter((order) => selectedNewOrders?.includes(order.bulkIndex));

  const filteredOrders = selectedOrdersFromBulk?.filter((order) => {
    if (order.discount) return false;

    if (selectedDiscount) {
      const menuItem = items?.find((item) => item._id === order.item);
      const category = categories?.find(
        (cat) => cat._id === menuItem?.category
      );
      return category?.discounts?.includes(selectedDiscount._id);
    }
    return true;
  });

  return (
    <div className="flex flex-col h-[60%] overflow-scroll no-scrollbar">
      <OrderScreenHeader header={t("Select Order")} />

      {filteredOrders?.map((order, index) => {
        const orderItem = getItem(order.item, items);

        const foundOrder = selectedOrders.find(
          (item) => item.order.bulkIndex === order.bulkIndex
        );

        return (
          <div
            key={`${order.item}-${order.bulkIndex}-${index}`}
            className="flex flex-row justify-between items-center px-2 py-1 pb-2 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              const maxQuantity = order.quantity || 0;

              if (foundOrder) {
                if (foundOrder.selectedQuantity >= maxQuantity) {
                  setSelectedOrders(
                    selectedOrders.filter(
                      (item) => item.order.bulkIndex !== order.bulkIndex
                    )
                  );
                } else {
                  setSelectedOrders([
                    ...selectedOrders.filter(
                      (item) => item.order.bulkIndex !== order.bulkIndex
                    ),
                    {
                      order: { ...order, bulkIndex: order.bulkIndex } as Order,
                      totalQuantity: maxQuantity,
                      selectedQuantity: foundOrder.selectedQuantity + 1,
                    },
                  ]);
                }
              } else {
                setSelectedOrders([
                  ...selectedOrders,
                  {
                    order: { ...order, bulkIndex: order.bulkIndex } as Order,
                    totalQuantity: maxQuantity,
                    selectedQuantity: 1,
                  },
                ]);
              }
            }}
          >
            <div className="flex flex-row gap-1 items-center justify-center text-sm font-medium py-0.5">
              <p
                className="p-1 border border-black w-5 h-5 items-center justify-center flex text-sm text-red-600 font-medium cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();

                  const maxQuantity = order.quantity || 0;
                  const foundSelectedOrder = selectedOrders.find(
                    (item) => item.order.bulkIndex === order.bulkIndex
                  );

                  if (foundSelectedOrder?.selectedQuantity === maxQuantity) {
                    setSelectedOrders(
                      selectedOrders.filter(
                        (item) => item.order.bulkIndex !== order.bulkIndex
                      )
                    );
                  } else {
                    setSelectedOrders([
                      ...selectedOrders.filter(
                        (item) => item.order.bulkIndex !== order.bulkIndex
                      ),
                      {
                        order: {
                          ...order,
                          bulkIndex: order.bulkIndex,
                        } as Order,
                        totalQuantity: maxQuantity,
                        selectedQuantity: maxQuantity,
                      },
                    ]);
                  }
                }}
              >
                {foundOrder?.selectedQuantity ?? ""}
              </p>
              <p>
                ({order.quantity}) - {orderItem?.name}
              </p>
            </div>

            <div className="flex flex-row gap-2 justify-center items-center text-sm font-medium">
              <p>
                {((order.unitPrice || 0) * (order.quantity || 0)).toFixed(2)}₺
              </p>
            </div>
          </div>
        );
      })}
      {filteredOrders?.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          {t("No applicable products for this discount")}
        </div>
      )}
    </div>
  );
};

export default NewOrderProductSelect;
