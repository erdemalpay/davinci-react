import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDataContext } from "../../context/Data.context";
import { NO_IMAGE_URL } from "../../navigation/constants";
import { Order, OrderStatus, User } from "../../types";
import {
  useCreateOrderForDivideMutation,
  useOrderMutations,
} from "../../utils/api/order/order";
import { getItem } from "../../utils/getItem";
import { GenericButton } from "../common/GenericButton";
import CommonSelectInput from "../common/SelectInput";
import Timer from "../common/Timer";

type Props = {
  order: Order;
  user: User;
};

const SingleOrderCard = ({ order, user }: Props) => {
  const { updateOrder } = useOrderMutations();
  const { mutate: createOrderForDivide } = useCreateOrderForDivideMutation();
  const { t } = useTranslation();

  const { users = [], menuItems: items, kitchens = [] } = useDataContext();
  const orderCreatedSound = new Audio("/sounds/orderCreateSound.mp3");
  // const orderUpdatedSound = new Audio("/sounds/mixitPositive.wav");
  orderCreatedSound.volume = 1;
  const audioContext = new window.AudioContext();
  const gainNode = audioContext.createGain();

  // Set the gain to 2 (double the volume)
  gainNode.gain.value = 12;
  const source = audioContext.createMediaElementSource(orderCreatedSound);

  // Connect the source to the gain node, and the gain node to the destination
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  if (!items || !users) {
    return null;
  }
  const timerSetter = () => {
    if (order?.status === OrderStatus.PENDING) {
      return order?.createdAt;
    } else if (order?.status === OrderStatus.READYTOSERVE) {
      return order?.preparedAt || order?.createdAt;
    } else {
      return order?.createdAt;
    }
  };
  useEffect(() => {
    let intervalId: NodeJS.Timeout | number;
    const foundKitchen = getItem(order?.kitchen, kitchens);
    if (
      order?.status === OrderStatus.CONFIRMATIONREQ &&
      foundKitchen?.soundRoles?.includes(user?.role?._id)
    ) {
      if (
        foundKitchen?.selectedUsers &&
        !foundKitchen?.selectedUsers?.includes(user?._id)
      ) {
        return;
      }
      intervalId = setInterval(() => {
        orderCreatedSound
          .play()
          .catch((error) => console.error("Error playing sound:", error));
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [order?.status, user?.role?._id]);

  return (
    <div className="flex flex-col justify-between border border-gray-200 rounded-lg bg-white shadow-sm __className_a182b8">
      <div className="flex flex-row gap-4 px-2 mt-1">
        {/* img & time */}
        <div className="flex flex-col gap-1 h-16  items-center ">
          {order?.status !== OrderStatus.SERVED && (
            <Timer createdAt={timerSetter() ?? new Date()} />
          )}
          <img
            src={getItem(order?.item, items)?.imageUrl || NO_IMAGE_URL}
            alt="item"
            className="w-10 h-10 object-cover rounded-lg"
          />
        </div>
        {/* itemName,quantity & orderNote */}
        <div className="flex flex-col gap-2 justify-center items-center w-full">
          <div className="flex flex-row justify-between w-full pr-2 items-center">
            <p>{getItem(order?.item, items)?.name}</p>
            {order?.quantity === 1 && (
              <p className="border px-2 py-0.5 border-gray-300 rounded-md">
                {order?.quantity}
              </p>
            )}
            {order?.quantity > 1 && (
              <CommonSelectInput
                options={[...Array(order?.quantity - 1)].map((_, index) => ({
                  value: (index + 1).toString(),
                  label: `${index + 1}`,
                }))}
                className="text-sm mt-1 min-w-20"
                placeholder={order?.quantity.toString()}
                value={{
                  value: order?.quantity.toString(),
                  label: order?.quantity.toString(),
                }}
                onChange={(selectedOption: any) => {
                  createOrderForDivide({
                    orders: [
                      {
                        totalQuantity: order?.quantity,
                        selectedQuantity: selectedOption.value,
                        orderId: order?._id,
                      },
                    ],
                  });
                }}
              />
            )}
          </div>
          {order?.note && (
            <p className="text-xs text-left w-full max-w-full break-words overflow-hidden hyphens-auto">
              {order?.note}
            </p>
          )}
        </div>
      </div>
      {/* createdBy and buttons */}
      <div className="flex flex-row justify-between w-full px-2 mb-1 items-center">
        {/* created by */}
        <div className="flex flex-col gap-1">
          <p className="text-xs text-gray-500">
            {t("Created By")}: {getItem(order?.createdBy, users)?.name}
          </p>
          {(order?.activityTableName || order?.activityPlayer) && (
            <p className="text-gray-600 text-xs ml-aut flex flex-row gap-1">
              {order?.activityTableName && (
                <span>
                  {"(" + t("Table") + " " + order?.activityTableName + ")"}
                </span>
              )}
              {order?.activityPlayer && (
                <span>
                  {"(" + t("Player") + " " + order?.activityPlayer + ")"}
                </span>
              )}
            </p>
          )}
        </div>

        {/* buttons */}
        <div className="  flex flex-row justify-between gap-2  ">
          {/* cancel button */}
          {order?.paidQuantity === 0 && !order?.isPaymentMade && (
            <GenericButton
              onClick={() => {
                updateOrder({
                  id: order?._id,
                  updates: {
                    status: OrderStatus.CANCELLED,
                    cancelledAt: new Date(),
                    cancelledBy: user._id,
                  },
                });
              }}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-900 border border-gray-300"
            >
              {t("Cancel")}
            </GenericButton>
          )}
          {/* confirmation  button */}
          {order?.status === OrderStatus.CONFIRMATIONREQ && (
            <GenericButton
              onClick={() => {
                updateOrder({
                  id: order?._id,
                  updates: {
                    status: OrderStatus.PENDING,
                    confirmedAt: new Date(),
                    confirmedBy: user._id,
                  },
                });
              }}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-black border border-gray-300"
            >
              {t("Confirm")}
            </GenericButton>
          )}

          {/* back to pending  button */}
          {(order?.status === OrderStatus.READYTOSERVE ||
            (order?.confirmedAt && order?.status === OrderStatus.PENDING)) && (
            <div className="flex flex-row gap-2  ">
              <GenericButton
                onClick={() => {
                  if (order?.status === OrderStatus.PENDING) {
                    updateOrder({
                      id: order?._id,
                      updates: {
                        status: OrderStatus.CONFIRMATIONREQ,
                      },
                    });
                  }
                  if (order?.status === OrderStatus.READYTOSERVE) {
                    updateOrder({
                      id: order?._id,
                      updates: {
                        status: OrderStatus.PENDING,
                      },
                    });
                  }
                }}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-black border border-gray-300"
              >
                {t("Back")}
              </GenericButton>
            </div>
          )}
          {/* pending ready button */}
          {order?.status === OrderStatus.PENDING && (
            <GenericButton
              onClick={() => {
                updateOrder({
                  id: order?._id,
                  updates: {
                    status: OrderStatus.READYTOSERVE,
                    preparedAt: new Date(),
                    preparedBy: user._id,
                  },
                });
              }}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-black border border-gray-300"
            >
              {t("Ready")}
            </GenericButton>
          )}
          {order?.status === OrderStatus.READYTOSERVE && (
            <div className="flex flex-row ">
              <GenericButton
                onClick={() => {
                  updateOrder({
                    id: order?._id,
                    updates: {
                      status: OrderStatus.SERVED,
                      deliveredAt: new Date(),
                      deliveredBy: user._id,
                    },
                  });
                }}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-black border border-gray-300"
              >
                {t("Served")}
              </GenericButton>
            </div>
          )}
          {order?.status === OrderStatus.SERVED &&
            user._id === order?.deliveredBy && (
              <div className="flex flex-row ">
                <GenericButton
                  onClick={() => {
                    updateOrder({
                      id: order?._id,
                      updates: {
                        status: OrderStatus.READYTOSERVE,
                      },
                    });
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-black border border-gray-300"
                >
                  {t("Back")}
                </GenericButton>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SingleOrderCard;
