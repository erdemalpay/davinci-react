import { useTranslation } from "react-i18next";
import { GrCheckbox, GrCheckboxSelected } from "react-icons/gr";
import { useOrderContext } from "../../../../context/Order.context";
import { MenuItem, Order } from "../../../../types";
import OrderScreenHeader from "./OrderScreenHeader";
type Props = {
  tableOrders: Order[];
};
const OrderSelect = ({ tableOrders }: Props) => {
  const { t } = useTranslation();
  const {
    temporaryOrders,
    selectedOrders,
    setSelectedOrders,
    isSelectAll,
    setIsSelectAll,
    isProductDivideOpen,
    setIsProductDivideOpen,
  } = useOrderContext();
  return (
    <div className="flex flex-col h-52 overflow-scroll no-scrollbar  ">
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
                tableOrders.map((order) => {
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
      {tableOrders
        ?.filter((order) => !order.discount)
        ?.map((order) => {
          const isAllPaid = order.paidQuantity === order.quantity;
          if (isAllPaid) return null;
          const tempOrder = temporaryOrders.find(
            (tempOrder) => tempOrder.order._id === order._id
          );
          const isAllPaidWithTempOrder =
            order.paidQuantity + (tempOrder?.quantity ?? 0) === order.quantity;
          if (isAllPaidWithTempOrder) return null;
          return (
            <div
              key={order._id}
              className="flex flex-row justify-between items-center px-2 py-1  pb-2 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                const foundOrder = selectedOrders.find(
                  (item) => item.order._id === order._id
                );
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
                    foundOrder.totalQuantity > foundOrder.selectedQuantity
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
              <div className="flex flex-row gap-1 items-center justify-center  text-sm font-medium py-0.5">
                <p
                  className="p-1 border border-black  w-5 h-5 items-center justify-center flex text-sm text-red-600 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isProductDivideOpen) return;
                    const foundSelectedOrder = selectedOrders.find(
                      (item) => item.order._id === order._id
                    );
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
                  {selectedOrders.find((item) => item.order._id === order._id)
                    ?.selectedQuantity ?? ""}
                </p>
                <p>
                  {"("}
                  {order.quantity -
                    (order.paidQuantity + (tempOrder?.quantity ?? 0))}
                  {")"}-
                </p>
                <p>{(order.item as MenuItem).name}</p>
              </div>
              {/* buttons */}
              <div className="flex flex-row gap-2 justify-center items-center text-sm font-medium">
                <p>
                  {order.unitPrice *
                    (order.quantity -
                      (order.paidQuantity + (tempOrder?.quantity ?? 0)))}
                  ₺
                </p>
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default OrderSelect;
