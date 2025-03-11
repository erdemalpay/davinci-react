import { Tooltip } from "@material-tailwind/react";
import { useTranslation } from "react-i18next";
import {
  MdOutlineCancel,
  MdOutlineOnlinePrediction,
  MdOutlineTouchApp,
} from "react-icons/md";
import { toast } from "react-toastify";
import { useOrderContext } from "../../../../context/Order.context";
import { Order, OrderDiscountStatus, OrderStatus } from "../../../../types";
import { useGetMenuItems } from "../../../../utils/api/menu/menu-item";
import {
  useCancelOrderForDiscountMutation,
  useOrderMutations,
} from "../../../../utils/api/order/order";
import { useGetOrderDiscounts } from "../../../../utils/api/order/orderDiscount";
import { getItem } from "../../../../utils/getItem";
import CommonSelectInput from "../../../common/SelectInput";
import { orderBgColor } from "../../../tables/OrderCard";
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
  const items = useGetMenuItems();
  const discounts = useGetOrderDiscounts()?.filter(
    (discount) => discount?.status !== OrderDiscountStatus.DELETED
  );
  const discountAmount = tableOrders.reduce((acc, order) => {
    if (!order?.discount) {
      return acc;
    }
    const discountValue =
      (order?.unitPrice * order?.quantity * (order?.discountPercentage ?? 0)) /
        100 +
      (order?.discountAmount ?? 0) * order?.quantity;
    return acc + discountValue;
  }, 0);
  const totalAmount = tableOrders.reduce((acc, order) => {
    return acc + order?.unitPrice * order?.quantity;
  }, 0);
  const {
    temporaryOrders,
    setPaymentAmount,
    setTemporaryOrders,
    paymentAmount,
    isOrderDivisionActive,
    setIsOrderDivisionActive,
  } = useOrderContext();
  const tooltipContent = (order: Order) => {
    switch (order?.status) {
      case OrderStatus.PENDING:
        return "Order is pending.";
      case OrderStatus.READYTOSERVE:
        return "Order is ready to serve.";
      case OrderStatus.CONFIRMATIONREQ:
        return "Order is waiting for confirmation";
      default:
        return "Order is served";
    }
  };
  return (
    <div className="flex flex-col h-[60%] overflow-scroll no-scrollbar min-h-80  ">
      <OrderScreenHeader header="Unpaid Orders" />
      {/* orders */}
      {tableOrders
        ?.sort((a, b) => a.item - b.item)
        .map((order) => {
          const isAllPaid = order?.paidQuantity === order?.quantity;
          if (!order || isAllPaid) return null;
          const tempOrder = temporaryOrders.find(
            (tempOrder) => tempOrder.order?._id === order?._id
          );
          const isAllPaidWithTempOrder =
            order?.paidQuantity + (tempOrder?.quantity ?? 0) ===
            order?.quantity;
          if (isAllPaidWithTempOrder) return null;

          const handlePaymentAmount = (order: Order) => {
            if (order?.discount) {
              return order?.discountPercentage
                ? order?.unitPrice *
                    (100 - (order?.discountPercentage ?? 0)) *
                    (1 / 100)
                : order?.unitPrice - (order?.discountAmount ?? 0);
            } else {
              return order?.unitPrice;
            }
          };
          const renderOrderDiv = (order: Order) => {
            return (
              <div
                key={order?._id + "unpaid"}
                className={`flex flex-row justify-between items-center px-2 py-1  pb-2 border-b border-gray-200  cursor-pointer ${
                  order?.status !== OrderStatus.SERVED
                    ? orderBgColor(order, "hover:bg-gray-100")
                    : "hover:bg-gray-100"
                }`}
                onClick={() => {
                  const tempOrder = temporaryOrders?.find(
                    (tempOrder) => tempOrder.order?._id === order?._id
                  );
                  const orderPrice = order?.division
                    ? Number(
                        (order?.quantity -
                          order?.paidQuantity -
                          (tempOrder?.quantity ?? 0) -
                          order?.quantity / order?.division <
                        1e-6
                          ? handlePaymentAmount(order) *
                            (order?.quantity -
                              order?.paidQuantity -
                              (tempOrder?.quantity ?? 0))
                          : (handlePaymentAmount(order) * order?.quantity) /
                            order?.division
                        ).toFixed(2)
                      )
                    : Number(handlePaymentAmount(order).toFixed(2));

                  if (temporaryOrders.length === 0) {
                    setPaymentAmount(
                      String(
                        orderPrice + collectionsTotalAmount >
                          totalAmount - discountAmount
                          ? totalAmount -
                              discountAmount -
                              collectionsTotalAmount
                          : orderPrice
                      )
                    );
                  } else if (
                    order?.division &&
                    order?.quantity -
                      order?.paidQuantity -
                      (tempOrder?.quantity ?? 0) <
                      (2 * order?.quantity) / order?.division
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
                          ? totalAmount -
                              discountAmount -
                              collectionsTotalAmount
                          : Number(paymentAmount) + orderPrice
                      )
                    );
                  }
                  if (tempOrder) {
                    setTemporaryOrders(
                      temporaryOrders?.map((tempOrder) => {
                        if (tempOrder.order?._id === order?._id) {
                          const orderDivisionCondition = order?.division
                            ? order?.quantity -
                              order?.paidQuantity -
                              tempOrder.quantity -
                              order?.quantity / order?.division
                            : 0;

                          return {
                            ...tempOrder,
                            quantity: order?.division
                              ? orderDivisionCondition < 1e-6
                                ? order?.quantity - order?.paidQuantity
                                : tempOrder.quantity +
                                  order?.quantity / order?.division
                              : tempOrder.quantity +
                                Math.min(
                                  order?.quantity -
                                    order?.paidQuantity -
                                    tempOrder.quantity,
                                  1
                                ),
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
                          ? order?.quantity / order?.division
                          : Math.min(order?.quantity - order?.paidQuantity, 1),
                      },
                    ]);
                  }
                  setIsOrderDivisionActive(false);
                }}
              >
                {/* item name,quantity part */}
                <div className="flex flex-row gap-1 text-sm font-medium py-0.2 items-center">
                  <p className="mr-auto">
                    {"("}
                    {(() => {
                      const remainingQuantity =
                        order?.quantity -
                        (order?.paidQuantity + (tempOrder?.quantity ?? 0));

                      return Number.isInteger(remainingQuantity)
                        ? remainingQuantity
                        : remainingQuantity.toFixed(2);
                    })()}
                    {")"}-
                  </p>
                  <div className="flex flex-col gap-1 justify-start mr-auto ">
                    <div className="flex flex-row justify-center items-center gap-2 mr-auto">
                      <p className={`${order?.division ? "max-w-28" : ""}`}>
                        {getItem(order?.item, items)?.name}
                      </p>
                      {order?.activityPlayer && (
                        <p className="text-gray-600">
                          {"(" + order?.activityPlayer + ")"}
                        </p>
                      )}
                      {order?.isOnlinePrice && (
                        <Tooltip
                          content={"online"}
                          placement="top"
                          className={"!z-[999999999999999999999]"}
                        >
                          <div className="relative">
                            <MdOutlineOnlinePrediction className="w-6 h-6" />
                          </div>
                        </Tooltip>
                      )}

                      {/* order division */}
                      {(isOrderDivisionActive || order?.division) && (
                        <div
                          className="flex"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <CommonSelectInput
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
                                order?.division &&
                                order?.division !== 1 &&
                                order?.paidQuantity !== 0
                              ) {
                                toast.error(
                                  t("Order division cannot be changed.")
                                );
                                return;
                              }
                              if (
                                selectedOption.value === "1" &&
                                order?.paidQuantity === 0
                              ) {
                                updateOrder({
                                  id: order?._id,
                                  updates: {
                                    division: 1,
                                  },
                                });
                                setTemporaryOrders([]);
                                setPaymentAmount("");
                                return;
                              }
                              updateOrder({
                                id: order?._id,
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
                    {order?.discount && (
                      <div
                        className="text-xs text-white bg-red-600 p-0.5 rounded-md cursor-pointer z-100 flex flex-row gap-1 justify-center items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelOrderForDiscount({
                            orderId: order?._id,
                            cancelQuantity:
                              order?.quantity - order?.paidQuantity,
                          });
                        }}
                      >
                        <p>{getItem(order?.discount, discounts)?.name}</p>
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
                          order?.unitPrice *
                          (order?.quantity -
                            (order?.paidQuantity + (tempOrder?.quantity ?? 0)))
                        ).toFixed(2)}
                        ₺
                      </p>
                      <p>
                        {(
                          (order?.discountPercentage
                            ? order?.unitPrice *
                              (100 - (order?.discountPercentage ?? 0)) *
                              (1 / 100)
                            : order?.unitPrice - (order?.discountAmount ?? 0)) *
                          (order?.quantity -
                            (order?.paidQuantity + (tempOrder?.quantity ?? 0)))
                        ).toFixed(2)}
                        ₺
                      </p>
                    </div>
                  )}
                  {!order?.discount && (
                    <p>
                      {(
                        order?.unitPrice *
                        (order?.quantity -
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
                        (tempOrder) => tempOrder.order?._id === order?._id
                      );
                      const orderPrice = order?.division
                        ? Number(
                            (
                              (order?.quantity -
                                order?.paidQuantity -
                                (tempOrder?.quantity ?? 0) <
                              order?.quantity / order?.division
                                ? handlePaymentAmount(order) *
                                  (order?.quantity -
                                    order?.paidQuantity -
                                    (tempOrder?.quantity ?? 0))
                                : handlePaymentAmount(order) *
                                  order?.quantity) / order?.division
                            ).toFixed(2)
                          )
                        : Number(handlePaymentAmount(order).toFixed(2));

                      if (temporaryOrders.length === 0) {
                        setPaymentAmount(
                          String(
                            Math.min(
                              totalAmount -
                                discountAmount -
                                collectionsTotalAmount,
                              (order?.discount
                                ? orderPrice
                                : order?.unitPrice) *
                                (order?.quantity - order?.paidQuantity) *
                                (order?.division && order?.discount
                                  ? order?.division / order?.quantity
                                  : 1)
                            )
                          )
                        );
                      } else if (
                        order?.division &&
                        order?.quantity -
                          order?.paidQuantity -
                          (tempOrder?.quantity ?? 0) <
                          (2 * order?.quantity) / order?.division
                      ) {
                        setPaymentAmount(
                          String(
                            Math.min(
                              totalAmount -
                                discountAmount -
                                collectionsTotalAmount,
                              Number(paymentAmount) +
                                (order?.discount
                                  ? orderPrice
                                  : order?.unitPrice) *
                                  (order?.quantity -
                                    order?.paidQuantity -
                                    (tempOrder?.quantity ?? 0))
                            )
                          )
                        );
                      } else {
                        const addedAmount =
                          Number(paymentAmount) +
                          (order?.discount ? orderPrice : order?.unitPrice) *
                            (order?.quantity -
                              order?.paidQuantity -
                              (tempOrder?.quantity ?? 0)) *
                            (order?.division && order?.discount
                              ? order?.division / order?.quantity
                              : 1);
                        setPaymentAmount(
                          String(
                            Math.round(
                              Math.min(
                                totalAmount -
                                  discountAmount -
                                  collectionsTotalAmount,
                                addedAmount
                              )
                            )
                          )
                        );
                      }
                      setTemporaryOrders([
                        ...(temporaryOrders?.filter(
                          (tempOrder) => tempOrder.order?._id !== order?._id
                        ) || []),
                        {
                          order: order,
                          quantity: order?.quantity - order?.paidQuantity,
                        },
                      ]);
                    }}
                  />
                </div>
              </div>
            );
          };
          return [
            OrderStatus.PENDING,
            OrderStatus.READYTOSERVE,
            OrderStatus.CONFIRMATIONREQ,
          ].includes(order?.status as OrderStatus) ? (
            <Tooltip
              content={t(tooltipContent(order))}
              placement={"top"}
              className={"!z-[999999999999999999999]"}
            >
              {renderOrderDiv(order)}
            </Tooltip>
          ) : (
            renderOrderDiv(order)
          );
        })}
    </div>
  );
};

export default UnpaidOrders;
