import { useTranslation } from "react-i18next";
import { PiBellSimpleRingingFill } from "react-icons/pi";
import { TbArrowBack } from "react-icons/tb";
import { NO_IMAGE_URL } from "../../navigation/constants";
import { MenuItem, Order, OrderStatus, User } from "../../types";
import { useOrderMutations } from "../../utils/api/order/order";
import Timer from "../common/Timer";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";

type Props = {
  order: Order;
  user: User;
};

const SingleOrderCard = ({ order, user }: Props) => {
  const { updateOrder } = useOrderMutations();
  const { t } = useTranslation();
  const timerSetter = () => {
    switch (order.status) {
      case OrderStatus.PENDING:
        return order.createdAt;
      case OrderStatus.READYTOSERVE:
        return order.preparedAt;
      default:
        return order.createdAt;
    }
  };

  return (
    <div className="flex flex-col justify-between border border-gray-200 rounded-lg bg-white shadow-sm  max-h-24 __className_a182b8  overflow-scroll no-scrollbar">
      <div className="flex flex-row gap-4  px-2 mt-1  ">
        {/* img & time */}
        <div className="flex flex-col gap-1 h-16  items-center ">
          {order.status !== OrderStatus.SERVED && (
            <Timer createdAt={timerSetter() ?? new Date()} />
          )}
          <img
            src={(order.item as MenuItem)?.imageUrl || NO_IMAGE_URL}
            alt="item"
            className="w-10 h-10 object-cover rounded-lg"
          />
        </div>
        {/* itemName,quantity & orderNote */}
        <div className="flex flex-col gap-2 justify-center  items-center w-full h-full  overflow-scroll no-scrollbar  ">
          <div className="flex flex-row justify-between w-full pr-2 items-center ">
            <p>{(order.item as MenuItem)?.name}</p>
            <p>
              {order.quantity > 1 && "x"}
              {order.quantity}
            </p>
          </div>
          <p className="text-xs mr-auto">{order?.note}</p>
        </div>
      </div>
      {/* buttons */}
      <div className="  flex flex-row justify-between  px-2 ml-auto  ">
        {/* pending ready button */}
        {order.status === OrderStatus.PENDING && (
          <button
            onClick={() => {
              updateOrder({
                id: order._id,
                updates: {
                  status: OrderStatus.READYTOSERVE,
                  preparedAt: new Date(),
                  preparedBy: user._id,
                },
              });
            }}
            className="  rounded-lg"
          >
            <ButtonTooltip content={t("Ready")}>
              <PiBellSimpleRingingFill className="text-xl" />
            </ButtonTooltip>
          </button>
        )}
        {/* ready to serve back to pending  button */}
        {order.status === OrderStatus.READYTOSERVE && (
          <div className="flex flex-row gap-2  ">
            {user._id === (order.preparedBy as User)._id && (
              <button
                onClick={() => {
                  updateOrder({
                    id: order._id,
                    updates: {
                      status: OrderStatus.PENDING,
                    },
                  });
                }}
                className=" rounded-lg"
              >
                <ButtonTooltip content={t("Preparing")}>
                  <TbArrowBack className="text-xl" />
                </ButtonTooltip>
              </button>
            )}
            <button
              onClick={() => {
                updateOrder({
                  id: order._id,
                  updates: {
                    status: OrderStatus.SERVED,
                    deliveredAt: new Date(),
                    deliveredBy: user._id,
                  },
                });
              }}
              className="  rounded-lg"
            >
              <ButtonTooltip content={t("Served")}>
                <PiBellSimpleRingingFill className="text-xl" />
              </ButtonTooltip>
            </button>
          </div>
        )}
        {order.status === OrderStatus.SERVED &&
          user._id === (order.deliveredBy as User)?._id && (
            <div className="flex flex-row ">
              <button
                onClick={() => {
                  updateOrder({
                    id: order._id,
                    updates: {
                      status: OrderStatus.READYTOSERVE,
                    },
                  });
                }}
                className="  rounded-lg"
              >
                <ButtonTooltip content={t("Not Served")}>
                  <TbArrowBack className="text-xl" />
                </ButtonTooltip>
              </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default SingleOrderCard;
