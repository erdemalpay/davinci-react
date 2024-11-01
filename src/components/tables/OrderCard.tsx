import { useTranslation } from "react-i18next";
import { PiBellSimpleRingingFill } from "react-icons/pi";
import { useUserContext } from "../../context/User.context";
import { Order, OrderStatus, Table } from "../../types";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { useOrderMutations } from "../../utils/api/order/order";
import { getItem } from "../../utils/getItem";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";

type Props = {
  order: Order;
  table: Table;
};
export const orderBgColor = (order: Order, defaultBgColor?: string) => {
  switch (order?.status) {
    case OrderStatus.PENDING:
      return "bg-blue-200";
    case OrderStatus.READYTOSERVE:
      return "bg-orange-200";
    case OrderStatus.SERVED:
      return "bg-green-200";
    case OrderStatus.CONFIRMATIONREQ:
      return "bg-purple-200";
    default:
      return defaultBgColor ?? "bg-gray-100";
  }
};
const OrderCard = ({ order, table }: Props) => {
  const { t } = useTranslation();
  const { updateOrder } = useOrderMutations();
  const items = useGetMenuItems();
  const { user } = useUserContext();
  if (!user || !items) return <></>;

  const orderWaitTime = () => {
    const orderTime = new Date(order?.createdAt).getTime();
    const currentTime = new Date().getTime();
    return Math.floor((currentTime - orderTime) / 60000);
  };
  const orderServeUpdate = () => {
    if (order?.status === OrderStatus.READYTOSERVE) {
      updateOrder({
        id: order?._id,
        updates: {
          status: OrderStatus.SERVED,
          deliveredBy: user._id,
          deliveredAt: new Date(),
        },
      });
    } else if (order?.status === OrderStatus.SERVED) {
      updateOrder({
        id: order?._id,
        updates: { status: OrderStatus.READYTOSERVE },
      });
    }
  };
  return (
    <div
      key={order?._id}
      className={`flex justify-between text-xs  rounded-lg items-center px-2 py-1 ${orderBgColor(
        order
      )}`}
    >
      <div className="flex w-5/6 gap-1">
        <p>{getItem(order?.item, items)?.name} </p>
        <h1 className="text-xs">({order?.quantity})</h1>
      </div>

      <div className="flex flex-row ">
        {order?.status !== OrderStatus.PENDING &&
          (order?.status === OrderStatus.READYTOSERVE ? (
            <ButtonTooltip content={t("Served")}>
              <PiBellSimpleRingingFill
                className="text-green-500 cursor-pointer text-lg px-[0.5px]"
                onClick={orderServeUpdate}
              />
            </ButtonTooltip>
          ) : (
            // user._id === (order?.deliveredBy as User)?._id && (
            //   <ButtonTooltip content={t("Not Served")}>
            //     <PiBellSimpleRingingFill
            //       className="text-orange-500 cursor-pointer text-lg px-[0.5px]"
            //       onClick={orderServeUpdate}
            //     />
            //   </ButtonTooltip>
            // )
            <></> // not served button may be added later
          ))}
        {[OrderStatus.PENDING, OrderStatus.READYTOSERVE].includes(
          order?.status as OrderStatus
        ) && (
          <div className="flex flex-row gap-[1px]">
            <h5 className="text-xs whitespace-nowrap min-w-8">
              {orderWaitTime()} m
            </h5>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
