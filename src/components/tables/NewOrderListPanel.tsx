import { useTranslation } from "react-i18next";
import { FiMinusCircle } from "react-icons/fi";
import { GoPlusCircle } from "react-icons/go";
import { HiOutlineTrash } from "react-icons/hi2";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
} from "react-icons/md";
import { PiBellSimpleRingingFill } from "react-icons/pi";
import { useOrderContext } from "../../context/Order.context";
import { useUserContext } from "../../context/User.context";
import { OrderStatus } from "../../types";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { getItem } from "../../utils/getItem";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import NewOrderDiscounts from "./NewOrderDiscounts";

const NewOrderListPanel = () => {
  const items = useGetMenuItems();
  const { t } = useTranslation();
  const { user } = useUserContext();
  const {
    orderCreateBulk,
    setOrderCreateBulk,
    setSelectedNewOrders,
    selectedNewOrders,
  } = useOrderContext();
  return (
    <div className="flex flex-col justify-between h-full px-2  gap-3">
      {/* orders */}
      <div className="flex flex-col gap-1  text-sm ">
        {orderCreateBulk?.map((order, index) => {
          const orderItem = getItem(order.item, items);
          return (
            <div
              key={index}
              className={`rounded-lg px-2 py-1  ${
                orderCreateBulk[index].status !== OrderStatus.SERVED
                  ? "bg-yellow-200"
                  : "bg-green-200"
              } `}
            >
              <div className="flex flex-row gap-1  ">
                {selectedNewOrders?.includes(index) ? (
                  <MdOutlineCheckBox
                    className="my-auto mx-auto text-lg cursor-pointer hover:scale-105 w-fit "
                    onClick={() => {
                      setSelectedNewOrders(
                        selectedNewOrders?.filter(
                          (selectedOrder) => selectedOrder !== index
                        )
                      );
                    }}
                  />
                ) : (
                  <MdOutlineCheckBoxOutlineBlank
                    className="my-auto mx-auto text-lg cursor-pointer hover:scale-105 w-fit "
                    onClick={() => {
                      setSelectedNewOrders([...selectedNewOrders, index]);
                    }}
                  />
                )}
                <div className="flex flex-row justify-between items-center  w-full">
                  <div className="flex flex-row gap-2  items-center  ">
                    {/* name and quantity */}
                    <div className="flex w-5/6 gap-1 items-center ">
                      <p>{orderItem?.name}</p>
                      <h1 className="text-xs">({order.quantity})</h1>
                    </div>

                    {/* decrement */}
                    <FiMinusCircle
                      className="w-5 h-5 flex-shrink-0  text-red-500  hover:text-red-800 cursor-pointer focus:outline-none"
                      onClick={() => {
                        if (!order.quantity) return;
                        if (Number(order.quantity) === 1) {
                          const newOrders = [...orderCreateBulk];
                          newOrders.splice(index, 1);
                          setOrderCreateBulk(newOrders);
                          return;
                        } else {
                          const newOrders = [...orderCreateBulk];
                          newOrders[index].quantity =
                            Number(order.quantity) - 1;
                          setOrderCreateBulk(newOrders);
                        }
                      }}
                    />
                    <GoPlusCircle
                      className="w-5 h-5 flex-shrink-0  text-green-500  hover:text-green-800 cursor-pointer focus:outline-none"
                      onClick={() => {
                        if (!order.quantity) return;
                        const newOrders = [...orderCreateBulk];
                        newOrders[index].quantity = Number(order.quantity) + 1;
                        setOrderCreateBulk(newOrders);
                      }}
                    />
                  </div>

                  <div className="flex flex-row gap-2">
                    {orderCreateBulk[index].status !== OrderStatus.SERVED && (
                      <ButtonTooltip content={t("Served")}>
                        <PiBellSimpleRingingFill
                          className="text-green-500 cursor-pointer text-lg px-[0.5px]"
                          onClick={() => {
                            orderCreateBulk[index] = {
                              ...orderCreateBulk[index],
                              status: OrderStatus.SERVED,
                              deliveredAt: new Date(),
                              deliveredBy: user?._id,
                            };
                            setOrderCreateBulk([...orderCreateBulk]);
                          }}
                        />
                      </ButtonTooltip>
                    )}
                    <HiOutlineTrash
                      className="text-red-400 hover:text-red-700 cursor-pointer text-lg px-[0.5px]"
                      onClick={() =>
                        setOrderCreateBulk(
                          orderCreateBulk.filter((_, i) => i !== index)
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* discounts button */}
      {orderCreateBulk?.length > 0 && selectedNewOrders?.length > 0 && (
        <NewOrderDiscounts />
      )}
    </div>
  );
};

export default NewOrderListPanel;
