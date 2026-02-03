import { useTranslation } from "react-i18next";
import { FiMinusCircle } from "react-icons/fi";
import { GoPlusCircle } from "react-icons/go";
import { HiOutlineTrash } from "react-icons/hi2";
import { PiBellSimpleRingingFill } from "react-icons/pi";
import { toast } from "react-toastify";
import { useOrderContext } from "../../context/Order.context";
import { useUserContext } from "../../context/User.context";
import { OrderStatus } from "../../types";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { getItem } from "../../utils/getItem";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import NewOrderProductSelect from "./NewOrderProductSelect";

const NewOrderListPanel = () => {
  const items = useGetMenuItems();
  const { t } = useTranslation();
  const { user } = useUserContext();
  const {
    orderCreateBulk,
    setOrderCreateBulk,
    setSelectedNewOrders,
    selectedNewOrders,
    isProductSelectionOpen,
    setIsProductSelectionOpen,
    selectedOrders,
    setSelectedOrders,
  } = useOrderContext();
  

  // Buton yönetimi
  const buttons = [
    {
      label: t("Cancel"),
      onClick: () => {
        setIsProductSelectionOpen(false);
        setSelectedOrders([]);
      },
      isActive: isProductSelectionOpen,
    },
    {
      label: t("Back"),
      onClick: () => {
        if (isProductSelectionOpen) {
          setIsProductSelectionOpen(false);
        }
      },
      isActive: isProductSelectionOpen,
    },
    {
      label: t("Forward"),
      onClick: () => {
        setIsProductSelectionOpen(true);
      },
      isActive: isProductSelectionOpen,
    },
    {
      label: t("Apply"),
      onClick: () => {
        if (selectedOrders.length === 0) {
          toast.error(t("Please select an order"));
          return;
        }

        const newOrders: typeof orderCreateBulk = [];
        const newSelectedIndexes: number[] = [];

        orderCreateBulk?.forEach((order, index) => {
          const selectedOrder = selectedOrders.find(
            (sel) => sel.order?.bulkIndex === index
          );

          if (!selectedOrder) {
            newOrders.push(order);

            if (selectedNewOrders?.includes(index)) {
              newSelectedIndexes.push(newOrders.length - 1);
            }
            return;
          }

          const totalQuantity = selectedOrder.totalQuantity;
          const selectedQuantity = selectedOrder.selectedQuantity;
          const remainingQuantity = totalQuantity - selectedQuantity;

          if (remainingQuantity === 0) {
            newOrders.push({
              ...order,
              quantity: selectedQuantity,
            });

            newSelectedIndexes.push(newOrders.length - 1);
          } else {
            newOrders.push({
              ...order,
              quantity: selectedQuantity,
            });
            newSelectedIndexes.push(newOrders.length - 1); // İndirimli seçili

            newOrders.push({
              ...order,
              quantity: remainingQuantity,
            });
            newSelectedIndexes.push(newOrders.length - 1); // İndirimsiz de seçili
          }
        });

        setOrderCreateBulk(newOrders);

        setIsProductSelectionOpen(false);
        setSelectedOrders([]);
        setSelectedNewOrders(newSelectedIndexes);
      },
      isActive: isProductSelectionOpen,
    },
  ];
  return (
    <div className="flex flex-col justify-between  px-2   gap-3 ">
      {!isProductSelectionOpen && (
        <>
          <div className="flex flex-col  gap-1  text-sm ">
            {orderCreateBulk?.map((order, index) => {
              const orderItem = getItem(order?.item, items);
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
                    <div className="flex flex-row justify-between items-center  w-full">
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-1 items-center">
                          <p>{orderItem?.name}</p>
                          <h1 className="text-xs">({order?.quantity})</h1>
                        </div>
                      </div>

                      <div className="flex flex-row gap-2 items-center">
                        <FiMinusCircle
                          className="w-5 h-5 flex-shrink-0  text-red-500  hover:text-red-800 cursor-pointer focus:outline-none"
                          onClick={() => {
                            if (!order?.quantity) return;
                            if (Number(order?.quantity) === 1) {
                              const newOrders = [...orderCreateBulk];
                              newOrders.splice(index, 1);
                              setOrderCreateBulk(newOrders);
                              return;
                            } else {
                              const newOrders = [...orderCreateBulk];
                              newOrders[index].quantity =
                                Number(order?.quantity) - 1;
                              setOrderCreateBulk(newOrders);
                            }
                          }}
                        />
                        <GoPlusCircle
                          className="w-5 h-5 flex-shrink-0  text-green-500  hover:text-green-800 cursor-pointer focus:outline-none"
                          onClick={() => {
                            if (!order?.quantity) return;
                            const newOrders = [...orderCreateBulk];
                            newOrders[index].quantity =
                              Number(order?.quantity) + 1;
                            setOrderCreateBulk(newOrders);
                          }}
                        />

                        {(order?.activityTableName ||
                          order?.activityPlayer) && (
                          <p className="text-xs text-gray-700 whitespace-nowrap">
                            {order?.activityTableName &&
                              `${t("TableShort")}:${order?.activityTableName}`}
                            {order?.activityTableName &&
                              order?.activityPlayer &&
                              " - "}
                            {order?.activityPlayer &&
                              `${t("PlayerShort")}:${order?.activityPlayer}`}
                          </p>
                        )}
                        {orderCreateBulk[index].status !==
                          OrderStatus.SERVED && (
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
        </>
      )}

      {isProductSelectionOpen && <NewOrderProductSelect />}

      <div className="flex flex-row gap-2 justify-end ml-auto items-center mb-2">
        {buttons.map((button) => {
          if (button.isActive) {
            return (
              <button
                key={button.label}
                onClick={button.onClick}
                className="w-fit bg-gray-200 px-2 sm:px-4 py-1 sm:py-2 rounded-lg shadow-md focus:outline-none hover:bg-gray-300 text-red-300 hover:text-red-500 font-semibold"
              >
                {button.label}
              </button>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default NewOrderListPanel;
