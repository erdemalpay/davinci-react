import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { GrCheckbox, GrCheckboxSelected } from "react-icons/gr";
import { useDataContext } from "../../../../context/Data.context";
import { useOrderContext } from "../../../../context/Order.context";
import { Order, OrderDiscountStatus } from "../../../../types";
import { useGetCategories } from "../../../../utils/api/menu/category";
import { useGetOrderDiscounts } from "../../../../utils/api/order/orderDiscount";
import { getItem } from "../../../../utils/getItem";
import OrderScreenHeader from "./OrderScreenHeader";

type Props = {
  tableOrders: Order[];
};
const OrderSelect = ({ tableOrders }: Props) => {
  const { t } = useTranslation();
  const categories = useGetCategories();
  const { menuItems: items = [] } = useDataContext();
  const discounts = useGetOrderDiscounts()?.filter(
    (discount) => discount?.status !== OrderDiscountStatus.DELETED
  );
  if (!categories) return <></>;
  const {
    temporaryOrders,
    selectedOrders,
    setSelectedOrders,
    isSelectAll,
    setIsSelectAll,
    selectedDiscount,
    isProductDivideOpen,
    isTransferProductOpen,
  } = useOrderContext();

  // Create Maps for O(1) lookup instead of O(n) find operations
  const temporaryOrdersMap = useMemo(() => {
    const map = new Map();
    temporaryOrders.forEach((tempOrder) => {
      map.set(tempOrder.order._id, tempOrder);
    });
    return map;
  }, [temporaryOrders]);

  const selectedOrdersMap = useMemo(() => {
    const map = new Map();
    selectedOrders.forEach((selectedOrder) => {
      map.set(selectedOrder.order._id, selectedOrder);
    });
    return map;
  }, [selectedOrders]);

  let filteredOrders = tableOrders?.filter(
    (order) => isTransferProductOpen || !order.discount
  );
  if (selectedDiscount) {
    filteredOrders = filteredOrders.filter((order) =>
      categories
        ?.find(
          (category) => category._id === getItem(order?.item, items)?.category
        )
        ?.discounts?.includes(selectedDiscount._id)
    );
  }
  return (
    <div className="flex flex-col h-[60%] overflow-scroll no-scrollbar  ">
      <OrderScreenHeader header="Select Order" />
      {/* select all */}
      {!isProductDivideOpen && (
        <div
          className="ml-2 mr-auto flex flex-row gap-2 justify-start items-center  w-full pb-2 border-b border-gray-200 hover:bg-gray-100 cursor-pointer "
          onClick={() => {
            if (isSelectAll) {
              setIsSelectAll(false);
              setSelectedOrders([]);
            } else {
              setIsSelectAll(true);
              setSelectedOrders(
                filteredOrders?.map((order) => {
                  return {
                    order: order,
                    totalQuantity: order?.quantity ?? 0,
                    selectedQuantity:
                      (order?.quantity ?? 0) - (order?.paidQuantity ?? 0),
                  };
                })
              );
            }
          }}
        >
          {isSelectAll ? (
            <GrCheckboxSelected className="w-4 h-4  " />
          ) : (
            <GrCheckbox className="w-4 h-4   " />
          )}
          <p>{t("All")}</p>
        </div>
      )}
      {/* orders */}
      {filteredOrders?.map((order) => {
        const isAllPaid = order.paidQuantity === order.quantity;
        if (isAllPaid) return null;
        const tempOrder = temporaryOrdersMap.get(order._id);
        const isAllPaidWithTempOrder =
          order.paidQuantity + (tempOrder?.quantity ?? 0) === order.quantity;
        if (isAllPaidWithTempOrder) return null;
        return (
          <div
            key={order._id}
            className="flex  flex-row justify-between items-center px-2 py-1  pb-2 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              const foundOrder = selectedOrdersMap.get(order._id);
              if (foundOrder) {
                if (isProductDivideOpen) {
                  if (
                    foundOrder.totalQuantity > 1 &&
                    foundOrder.totalQuantity - 1 > foundOrder.selectedQuantity
                  ) {
                    setSelectedOrders([
                      ...selectedOrders.filter(
                        (item) => item.order._id !== order._id
                      ),
                      {
                        order: order,
                        totalQuantity: order.quantity,
                        selectedQuantity: foundOrder.selectedQuantity + 1,
                      },
                    ]);
                  }
                  if (
                    foundOrder.totalQuantity - 1 ===
                    foundOrder.selectedQuantity
                  ) {
                    setSelectedOrders([
                      ...selectedOrders.filter(
                        (item) => item.order._id !== order._id
                      ),
                    ]);
                  }
                } else if (
                  !isProductDivideOpen &&
                  foundOrder.totalQuantity >
                    foundOrder.selectedQuantity + order.paidQuantity
                ) {
                  setSelectedOrders([
                    ...selectedOrders.filter(
                      (item) => item.order._id !== order._id
                    ),
                    {
                      order: order,
                      totalQuantity: order.quantity,
                      selectedQuantity: foundOrder.selectedQuantity + 1,
                    },
                  ]);
                } else {
                  setSelectedOrders([
                    ...selectedOrders.filter(
                      (item) => item.order._id !== order._id
                    ),
                  ]);
                }
              } else {
                if (isProductDivideOpen && order.quantity == 1) {
                  return;
                }
                setSelectedOrders([
                  ...selectedOrders,
                  {
                    order: order,
                    totalQuantity: order.quantity,
                    selectedQuantity: 1,
                  },
                ]);
              }
            }}
          >
            {/* item name,quantity part */}
            <div className="flex flex-row gap-1 items-center justify-center  text-sm font-medium py-0.5 ">
              <p
                className="p-1 border border-black  w-5 h-5 items-center justify-center flex text-sm text-red-600 font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isProductDivideOpen) return;
                  const foundSelectedOrder = selectedOrdersMap.get(order._id);
                  if (
                    foundSelectedOrder?.selectedQuantity ===
                    (order?.quantity ?? 0) - (order?.paidQuantity ?? 0)
                  ) {
                    setSelectedOrders([
                      ...selectedOrders.filter(
                        (item) => item.order._id !== order._id
                      ),
                    ]);
                  } else {
                    setSelectedOrders([
                      ...selectedOrders.filter(
                        (item) => item.order._id !== order._id
                      ),
                      {
                        order: order,
                        totalQuantity: order.quantity,
                        selectedQuantity:
                          (order?.quantity ?? 0) - (order?.paidQuantity ?? 0),
                      },
                    ]);
                  }
                }}
              >
                {selectedOrdersMap.get(order._id)?.selectedQuantity ?? ""}
              </p>
              <p>
                {"("}
                {order.quantity -
                  (order.paidQuantity + (tempOrder?.quantity ?? 0))}
                {")"}-
              </p>
              <div className="flex flex-col gap-1 justify-start">
                <div className="flex flex-row gap-1 items-center">
                  <p>{getItem(order?.item, items)?.name}</p>
                  {order?.activityPlayer && (
                    <p className="text-gray-600 text-xs">
                      {"(" + order?.activityPlayer + ")"}
                    </p>
                  )}
                </div>
                {order?.discount && (
                  <div className="text-xs text-white bg-red-600 p-0.5 rounded-md flex flex-row gap-1 justify-center items-center">
                    <p>{getItem(order?.discount, discounts)?.name}</p>
                  </div>
                )}
              </div>
            </div>
            {/* prices */}
            <div className="flex flex-row gap-2 justify-center items-center text-sm font-medium">
              {(() => {
                const remainingQuantity =
                  order?.quantity -
                  (order?.paidQuantity + (tempOrder?.quantity ?? 0));
                const originalPrice = (
                  order?.unitPrice * remainingQuantity
                ).toFixed(2);

                if (!order?.discount) {
                  return <p>{originalPrice}₺</p>;
                }

                const discountedUnitPrice = order?.discountPercentage
                  ? (order?.unitPrice * (100 - order.discountPercentage)) / 100
                  : order?.unitPrice - (order?.discountAmount ?? 0);
                const discountedPrice = (
                  discountedUnitPrice * remainingQuantity
                ).toFixed(2);

                return (
                  <div className="flex flex-col ml-auto justify-center items-center">
                    <p className="text-xs line-through">{originalPrice}₺</p>
                    <p>{discountedPrice}₺</p>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderSelect;
