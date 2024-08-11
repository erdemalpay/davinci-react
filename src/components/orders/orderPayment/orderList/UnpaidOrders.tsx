import { useTranslation } from "react-i18next";
import { MdOutlineCancel, MdOutlineTouchApp } from "react-icons/md";
import { toast } from "react-toastify";
import { useOrderContext } from "../../../../context/Order.context";
import { MenuItem, Order, OrderDiscount } from "../../../../types";
import {
  useCancelOrderForDiscountMutation,
  useOrderMutations,
} from "../../../../utils/api/order/order";
import SelectInput from "../../../common/SelectInput";
import OrderScreenHeader from "./OrderScreenHeader";

type Props = {
  tableOrders: Order[];
  collectionsTotalAmount: number;
};

const UnpaidOrders = ({ tableOrders, collectionsTotalAmount }: Props) => {
  const { t } = useTranslation();
  const { mutate: cancelOrderForDiscount } =
    useCancelOrderForDiscountMutation();
  const { updateOrder } = useOrderMutations();
  const discountAmount = tableOrders.reduce((acc, order) => {
    if (!order.discount) {
      return acc;
    }
    const discountValue =
      (order.unitPrice * order.quantity * (order?.discountPercentage ?? 0)) /
        100 +
      (order?.discountAmount ?? 0) * order.quantity;
    return acc + discountValue;
  }, 0);
  const totalAmount = tableOrders.reduce((acc, order) => {
    return acc + order.unitPrice * order.quantity;
  }, 0);
  const {
    temporaryOrders,
    setPaymentAmount,
    setTemporaryOrders,
    paymentAmount,
    isOrderDivisionActive,
    setIsOrderDivisionActive,
  } = useOrderContext();
  return (
    <div className="flex flex-col h-52 overflow-scroll no-scrollbar  ">
      <OrderScreenHeader header="Unpaid Orders" />
      {/* orders */}
      {tableOrders?.map((order) => {
        const isAllPaid = order.paidQuantity === order.quantity;
        if (!order || isAllPaid) return null;
        const tempOrder = temporaryOrders.find(
          (tempOrder) => tempOrder.order._id === order._id
        );
        const isAllPaidWithTempOrder =
          order.paidQuantity + (tempOrder?.quantity ?? 0) === order.quantity;
        if (isAllPaidWithTempOrder) return null;

        const handlePaymentAmount = (order: Order) => {
          if (order?.discount) {
            return order?.discountPercentage
              ? order.unitPrice *
                  (100 - (order?.discountPercentage ?? 0)) *
                  (1 / 100)
              : order.unitPrice - (order?.discountAmount ?? 0);
          } else {
            return order.unitPrice;
          }
        };
        return (
          <div
            key={order._id}
            className="flex flex-row justify-between items-center px-2 py-1  pb-2 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              const tempOrder = temporaryOrders?.find(
                (tempOrder) => tempOrder.order._id === order._id
              );
              const orderPrice = order?.division
                ? Number(
                    (
                      (order.quantity -
                        order.paidQuantity -
                        (tempOrder?.quantity ?? 0) <
                      order.quantity / order.division
                        ? handlePaymentAmount(order) *
                          (order.quantity -
                            order.paidQuantity -
                            (tempOrder?.quantity ?? 0))
                        : handlePaymentAmount(order) * order.quantity) /
                      order.division
                    ).toFixed(2)
                  )
                : Number(handlePaymentAmount(order).toFixed(2));

              if (temporaryOrders.length === 0) {
                setPaymentAmount(
                  String(
                    orderPrice + collectionsTotalAmount >
                      totalAmount - discountAmount
                      ? totalAmount - discountAmount - collectionsTotalAmount
                      : orderPrice
                  )
                );
              } else if (
                order.division &&
                order.quantity -
                  order.paidQuantity -
                  (tempOrder?.quantity ?? 0) <
                  (2 * order.quantity) / order.division
              ) {
                setPaymentAmount(
                  String(
                    Math.round(
                      Number(paymentAmount) +
                        orderPrice +
                        collectionsTotalAmount >
                        totalAmount - discountAmount
                        ? totalAmount - discountAmount - collectionsTotalAmount
                        : Number(paymentAmount) + orderPrice
                    )
                  )
                );
              } else {
                setPaymentAmount(
                  String(
                    Number(paymentAmount) +
                      orderPrice +
                      collectionsTotalAmount >
                      totalAmount - discountAmount
                      ? totalAmount - discountAmount - collectionsTotalAmount
                      : Number(paymentAmount) + orderPrice
                  )
                );
              }
              if (tempOrder) {
                setTemporaryOrders(
                  temporaryOrders?.map((tempOrder) => {
                    if (tempOrder.order._id === order._id) {
                      const orderDivisionCondition = order?.division
                        ? order.quantity -
                          order.paidQuantity -
                          tempOrder.quantity -
                          order.quantity / order.division
                        : 0;

                      return {
                        ...tempOrder,
                        quantity: order?.division
                          ? orderDivisionCondition <
                            order.quantity / order.division
                            ? order.quantity - order.paidQuantity
                            : tempOrder.quantity +
                              order.quantity / order.division
                          : tempOrder.quantity + 1,
                      };
                    }
                    return tempOrder;
                  })
                );
              } else {
                setTemporaryOrders([
                  ...temporaryOrders,
                  {
                    order,
                    quantity: order?.division
                      ? order.quantity / order.division
                      : 1,
                  },
                ]);
              }
              setIsOrderDivisionActive(false);
            }}
          >
            {/* item name,quantity part */}
            <div className="flex flex-row gap-1 text-sm font-medium py-0.5 items-center">
              <p className="mr-auto">
                {"("}
                {(() => {
                  const remainingQuantity =
                    order.quantity -
                    (order.paidQuantity + (tempOrder?.quantity ?? 0));

                  return Number.isInteger(remainingQuantity)
                    ? remainingQuantity
                    : remainingQuantity.toFixed(2);
                })()}
                {")"}-
              </p>
              <div className="flex flex-col gap-1 justify-start mr-auto ">
                <div className="flex flex-row justify-center items-center gap-2 mr-auto">
                  <p className={`${order.division ? "max-w-28" : ""}`}>
                    {(order.item as MenuItem).name}
                  </p>
                  {/* order division */}
                  {(isOrderDivisionActive || order.division) && (
                    <div
                      className="flex"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <SelectInput
                        options={[...Array(10)].map((_, index) => ({
                          value: (index + 1).toString(),
                          label: index === 0 ? t("Cancel") : `${index + 1}`,
                        }))}
                        className="text-sm"
                        placeholder="1/n"
                        value={
                          order?.division
                            ? {
                                value: order?.division.toString(),
                                label: `1/${order?.division?.toString()}`,
                              }
                            : null
                        }
                        onChange={(selectedOption: any) => {
                          if (
                            order?.division === Number(selectedOption.value)
                          ) {
                            return;
                          }
                          if (
                            order.division &&
                            order.division !== 1 &&
                            order.paidQuantity !== 0
                          ) {
                            toast.error("Order division cannot be changed.");
                            return;
                          }
                          if (
                            selectedOption.value === "1" &&
                            order.paidQuantity === 0
                          ) {
                            updateOrder({
                              id: order._id,
                              updates: {
                                division: 1,
                              },
                            });
                            setTemporaryOrders([]);
                            setPaymentAmount("");
                            return;
                          }
                          updateOrder({
                            id: order._id,
                            updates: {
                              division: Number(selectedOption.value),
                            },
                          });
                          setTemporaryOrders([]);
                          setPaymentAmount("");
                        }}
                      />
                    </div>
                  )}
                </div>
                {order.discount && (
                  <div
                    className="text-xs text-white bg-red-600 p-0.5 rounded-md cursor-pointer z-100 flex flex-row gap-1 justify-center items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelOrderForDiscount({
                        orderId: order._id,
                        cancelQuantity: order.quantity - order.paidQuantity,
                      });
                    }}
                  >
                    <p>{(order.discount as OrderDiscount).name}</p>
                    <MdOutlineCancel className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
            {/* buttons */}
            <div className="flex flex-row gap-2 justify-center items-center text-sm font-medium">
              {order?.discount && (
                <div className="flex flex-col ml-auto justify-center items-center">
                  <p className="text-xs line-through">
                    {(
                      order.unitPrice *
                      (order.quantity -
                        (order.paidQuantity + (tempOrder?.quantity ?? 0)))
                    ).toFixed(2)}
                    ₺
                  </p>
                  <p>
                    {(
                      (order?.discountPercentage
                        ? order.unitPrice *
                          (100 - (order?.discountPercentage ?? 0)) *
                          (1 / 100)
                        : order.unitPrice - (order?.discountAmount ?? 0)) *
                      (order.quantity -
                        (order?.paidQuantity + (tempOrder?.quantity ?? 0)))
                    ).toFixed(2)}
                    ₺
                  </p>
                </div>
              )}
              {!order?.discount && (
                <p>
                  {(
                    order.unitPrice *
                    (order.quantity -
                      (order?.paidQuantity + (tempOrder?.quantity ?? 0)))
                  ).toFixed(2)}
                  ₺
                </p>
              )}
              <MdOutlineTouchApp
                className="cursor-pointer hover:text-red-600 text-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  const tempOrder = temporaryOrders?.find(
                    (tempOrder) => tempOrder.order._id === order._id
                  );
                  const orderPrice = order?.division
                    ? Number(
                        (
                          (order.quantity -
                            order.paidQuantity -
                            (tempOrder?.quantity ?? 0) <
                          order.quantity / order.division
                            ? handlePaymentAmount(order) *
                              (order.quantity -
                                order.paidQuantity -
                                (tempOrder?.quantity ?? 0))
                            : handlePaymentAmount(order) * order.quantity) /
                          order.division
                        ).toFixed(2)
                      )
                    : Number(handlePaymentAmount(order).toFixed(2));

                  if (temporaryOrders.length === 0) {
                    setPaymentAmount(
                      String(
                        Math.min(
                          totalAmount - discountAmount - collectionsTotalAmount,
                          (order?.discount ? orderPrice : order.unitPrice) *
                            (order.quantity - order.paidQuantity) *
                            (order?.division
                              ? order.division / order.quantity
                              : 1)
                        )
                      )
                    );
                  } else if (
                    order.division &&
                    order.quantity -
                      order.paidQuantity -
                      (tempOrder?.quantity ?? 0) <
                      (2 * order.quantity) / order.division
                  ) {
                    setPaymentAmount(
                      String(
                        Math.round(
                          Number(paymentAmount) +
                            orderPrice +
                            collectionsTotalAmount >
                            totalAmount - discountAmount
                            ? totalAmount -
                                discountAmount -
                                collectionsTotalAmount
                            : Number(paymentAmount) +
                                (order?.discount
                                  ? orderPrice
                                  : order.unitPrice) *
                                  (order.quantity -
                                    order.paidQuantity -
                                    (tempOrder?.quantity ?? 0))
                        )
                      )
                    );
                  } else {
                    setPaymentAmount(
                      String(
                        Math.min(
                          totalAmount - discountAmount - collectionsTotalAmount,
                          Number(paymentAmount) +
                            (order?.discount ? orderPrice : order.unitPrice) *
                              (order.quantity -
                                order.paidQuantity -
                                (tempOrder?.quantity ?? 0)) *
                              (order?.division
                                ? order.division / order.quantity
                                : 1)
                        )
                      )
                    );
                  }
                  setTemporaryOrders([
                    ...temporaryOrders?.filter(
                      (tempOrder) => tempOrder.order._id !== order._id
                    ),
                    {
                      order: order,
                      quantity: order.quantity - order.paidQuantity,
                    },
                  ]);
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UnpaidOrders;
