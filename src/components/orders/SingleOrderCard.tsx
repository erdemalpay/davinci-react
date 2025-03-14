import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { NO_IMAGE_URL } from "../../navigation/constants";
import { Order, OrderStatus, RoleEnum, User } from "../../types";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import {
  useCreateOrderForDivideMutation,
  useOrderMutations,
} from "../../utils/api/order/order";
import { useGetUsers } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
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

  const users = useGetUsers();
  const items = useGetMenuItems();
  const orderCreatedSound = new Audio("/sounds/orderCreateSound.mp3");
  // const orderUpdatedSound = new Audio("/sounds/mixitPositive.wav");
  orderCreatedSound.volume = 1;
  const audioContext = new window.AudioContext();
  const gainNode = audioContext.createGain();

  // Set the gain to 2 (double the volume)
  gainNode.gain.value = 2;
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
      return order?.preparedAt;
    } else {
      return order?.createdAt;
    }
  };
  useEffect(() => {
    let intervalId: NodeJS.Timeout | number;
    if (
      order?.status === OrderStatus.CONFIRMATIONREQ &&
      user?.role?._id === RoleEnum.KITCHEN2
    ) {
      intervalId = setInterval(() => {
        orderCreatedSound
          .play()
          .catch((error) => console.error("Error playing sound:", error));
      }, 30000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [order?.status, user?.role?._id]);

  return (
    <div className="flex flex-col justify-between border border-gray-200 rounded-lg bg-white shadow-sm  max-h-28 __className_a182b8  overflow-scroll no-scrollbar">
      <div className="flex flex-row gap-4  px-2 mt-1  ">
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
        <div className="flex flex-col gap-2 justify-center  items-center w-full h-full  overflow-scroll no-scrollbar  ">
          <div className="flex flex-row justify-between w-full pr-2 items-center ">
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
          <p className="text-xs mr-auto">{order?.note}</p>
        </div>
      </div>
      {/* createdBy and buttons */}
      <div className="flex flex-row justify-between w-full px-2 mb-1 items-center">
        {/* created by */}
        <div className="flex flex-col gap-1">
          <p className="text-xs text-gray-500">
            {t("Created By")}: {getItem(order?.createdBy, users)?.name}
          </p>
          {order?.activityTableName && (
            <p className="text-gray-600 text-xs ml-auto">
              {"(" + t("Table") + " " + order?.activityTableName + ")"}
            </p>
          )}
        </div>

        {/* buttons */}
        <div className="  flex flex-row justify-between gap-2  ">
          {/* cancel button */}
          {order?.paidQuantity === 0 && (
            <button
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
              className=" bg-gray-100 px-2 py-1 rounded-lg focus:outline-none  hover:bg-gray-200 text-red-600 hover:text-red-900 font-medium text-sm "
            >
              {t("Cancel")}
            </button>
          )}
          {/* confirmation  button */}
          {order?.status === OrderStatus.CONFIRMATIONREQ && (
            <button
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
              className=" bg-gray-100 px-2 py-1 rounded-lg focus:outline-none  hover:bg-gray-200 text-gray-600 hover:text-black font-medium text-sm "
            >
              {t("Confirm")}
            </button>
          )}

          {/* back to pending  button */}
          {(order?.status === OrderStatus.READYTOSERVE ||
            (order?.confirmedAt && order?.status === OrderStatus.PENDING)) && (
            <div className="flex flex-row gap-2  ">
              <button
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
                className=" bg-gray-100 px-2 py-1 rounded-lg focus:outline-none  hover:bg-gray-200 text-gray-600 hover:text-black font-medium text-sm "
              >
                {t("Back")}
              </button>
            </div>
          )}
          {/* pending ready button */}
          {order?.status === OrderStatus.PENDING && (
            <button
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
              className=" bg-gray-100 px-2 py-1 rounded-lg focus:outline-none  hover:bg-gray-200 text-gray-600 hover:text-black font-medium text-sm "
            >
              {t("Ready")}
            </button>
          )}
          {order?.status === OrderStatus.READYTOSERVE && (
            <div className="flex flex-row ">
              <button
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
                className=" bg-gray-100 px-2 py-1 rounded-lg focus:outline-none  hover:bg-gray-200 text-gray-600 hover:text-black font-medium text-sm "
              >
                {t("Served")}
              </button>
            </div>
          )}
          {order?.status === OrderStatus.SERVED &&
            user._id === order?.deliveredBy && (
              <div className="flex flex-row ">
                <button
                  onClick={() => {
                    updateOrder({
                      id: order?._id,
                      updates: {
                        status: OrderStatus.READYTOSERVE,
                      },
                    });
                  }}
                  className=" bg-gray-100 px-2 py-1 rounded-lg focus:outline-none  hover:bg-gray-200 text-gray-600 hover:text-black font-medium text-sm "
                >
                  {t("Back")}
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SingleOrderCard;
