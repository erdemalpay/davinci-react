import { useTranslation } from "react-i18next";
import { PiBellSimpleRingingFill } from "react-icons/pi";
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
    <div className="flex flex-col justify-between border border-gray-200 rounded-lg bg-white shadow-sm  h-40">
      <div className="flex flex-row gap-4 mt-4 px-2">
        {/* img & time */}
        <div className="flex flex-col gap-2 h-full  items-center">
          {order.status !== OrderStatus.SERVED && (
            <Timer createdAt={timerSetter() ?? new Date()} />
          )}
          <img
            src={(order.item as MenuItem)?.imageUrl || NO_IMAGE_URL}
            alt="item"
            className="w-16 h-16 object-cover rounded-lg"
          />
        </div>
        {/* itemName,quantity & orderNote */}
        <div className="flex flex-col gap-2 justify-center  items-center w-full ">
          <div className="flex flex-row justify-between w-full pr-2">
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
      <div className="mt-1  ml-auto">
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
            className=" px-2 py-1 rounded-lg"
          >
            <ButtonTooltip content={t("Ready")}>
              <PiBellSimpleRingingFill className="text-xl" />
            </ButtonTooltip>
          </button>
        )}
      </div>
    </div>
  );
};

export default SingleOrderCard;
