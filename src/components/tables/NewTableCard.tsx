import { LockOpenIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Tooltip } from "@material-tailwind/react";
import { format } from "date-fns";
import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoReceipt } from "react-icons/io5";
import { MdBorderColor, MdBrunchDining } from "react-icons/md";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { useLocationContext } from "../../context/Location.context";
import { useOrderContext } from "../../context/Order.context";
import { useUserContext } from "../../context/User.context";

import {
  Game,
  Gameplay,
  MenuCategory,
  Order,
  OrderCollection,
  OrderStatus,
  Table,
  TableStatus,
  TURKISHLIRA,
  User,
} from "../../types";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import {
  useOrderMutations,
  useUpdateMultipleOrderMutation,
} from "../../utils/api/order/order";
import { useGetOrderDiscounts } from "../../utils/api/order/orderDiscount";
import {
  useReopenTableMutation,
  useTableMutations,
} from "../../utils/api/table";
import { getDuration } from "../../utils/time";
import { CardAction } from "../common/CardAction";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import { EditableText } from "../common/EditableText";
import { InputWithLabel } from "../common/InputWithLabel";
import OrderPaymentModal from "../orders/orderPayment/OrderPaymentModal";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import { CreateGameplayDialog } from "./CreateGameplayDialog";
import { EditGameplayDialog } from "./EditGameplayDialog";
import GameplayCard from "./GameplayCard";
import OrderCard from "./OrderCard";
import OrderListForPanel from "./OrderListForPanel";

export interface TableCardProps {
  table: Table;
  mentors: User[];
  games: Game[];
  showAllGameplays?: boolean;
  showAllOrders?: boolean;
  showServedOrders?: boolean;
  collections: OrderCollection[];
}

export function TableCard({
  table,
  mentors,
  games,
  showAllGameplays = false,
  showAllOrders = false,
  showServedOrders = false,
  collections,
}: TableCardProps) {
  const { t } = useTranslation();
  const [isGameplayDialogOpen, setIsGameplayDialogOpen] = useState(false);
  const [isEditGameplayDialogOpen, setIsEditGameplayDialogOpen] =
    useState(false);
  const [isDeleteConfirmationDialogOpen, setIsDeleteConfirmationDialogOpen] =
    useState(false);
  const [isOrderPaymentModalOpen, setIsOrderPaymentModalOpen] = useState(false);
  const [selectedGameplay, setSelectedGameplay] = useState<Gameplay>();
  const { updateTable } = useTableMutations();
  const { mutate: reopenTable } = useReopenTableMutation();
  const { selectedLocationId } = useLocationContext();
  const { createOrder } = useOrderMutations();
  const discounts = useGetOrderDiscounts();
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const { resetOrderContext } = useOrderContext();
  const { setExpandedRows } = useGeneralContext();
  const { user } = useUserContext();
  const { mutate: updateMultipleOrders } = useUpdateMultipleOrderMutation();
  const [orderForm, setOrderForm] = useState({
    item: 0,
    quantity: 0,
    note: "",
    discount: undefined,
    isOnlinePrice: false,
  });
  const [selectedTable, setSelectedTable] = useState<Table>();
  const menuItems = useGetMenuItems();
  const menuItemOptions = menuItems
    ?.filter((menuItem) => menuItem?.locations?.includes(selectedLocationId))
    ?.filter((menuItem) =>
      table?.isOnlineSale
        ? (menuItem.category as MenuCategory)?.isOnlineOrder
        : true
    )
    .map((menuItem) => {
      return {
        value: menuItem._id,
        label: menuItem.name + " (" + menuItem.price + TURKISHLIRA + ")",
      };
    });
  const filteredDiscounts = discounts.filter((discount) =>
    table?.isOnlineSale ? discount?.isOnlineOrder : !discount?.isOnlineOrder
  );
  const isOnlinePrice = () => {
    const menuItem = menuItems?.find((item) => item._id === orderForm.item);
    if ((menuItem?.category as MenuCategory)?.isOnlineOrder) {
      return true;
    }
    return false;
  };
  const orderInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "item",
      label: t("Product"),
      options: menuItemOptions.map((option) => {
        return {
          value: option.value,
          label: option.label,
        };
      }),
      invalidateKeys: [
        { key: "discount", defaultValue: undefined },
        { key: "isOnlinePrice", defaultValue: false },
      ],
      placeholder: t("Product"),
      required: true,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "quantity",
      label: t("Quantity"),
      placeholder: t("Quantity"),
      minNumber: 0,
      required: true,
      isNumberButtonsActive: true,
      isOnClearActive: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "discount",
      label: t("Discount"),
      options: orderForm?.item
        ? filteredDiscounts
            .filter((discount) => {
              const menuItem = menuItems?.find(
                (item) => item._id === orderForm.item
              );
              return (menuItem?.category as MenuCategory)?.discounts?.includes(
                discount._id
              );
            })
            ?.map((option) => {
              return {
                value: option._id,
                label: option.name,
              };
            })
        : [],
      placeholder: t("Discount"),
      isAutoFill: false,
      required: false,
    },
    {
      type: InputTypes.CHECKBOX,
      formKey: "isOnlinePrice",
      label: t("Online Price"),
      placeholder: t("Online Price"),
      required: isOnlinePrice(),
      isDisabled: !isOnlinePrice(),
      isTopFlexRow: true,
    },
    {
      type: InputTypes.TEXTAREA,
      formKey: "note",
      label: t("Note"),
      placeholder: t("Note"),
      required: false,
    },
  ];

  const orderFormKeys = [
    { key: "item", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
    { key: "discount", type: FormKeyTypeEnum.NUMBER },
    { key: "isOnlinePrice", type: FormKeyTypeEnum.BOOLEAN },
    { key: "note", type: FormKeyTypeEnum.STRING },
  ];
  const bgColor = table.finishHour
    ? "bg-gray-500"
    : table.orders?.some(
        (tableOrder) =>
          (tableOrder as Order)?.status === OrderStatus.READYTOSERVE
      )
    ? "bg-orange-200"
    : "bg-gray-200";

  function createGameplay() {
    setSelectedGameplay(undefined);
    setIsGameplayDialogOpen(true);
  }

  function getGameName(id: number) {
    const game = games.find((game) => game._id === id);
    return game?.name || "";
  }

  function reopenTableBack() {
    reopenTable({
      id: table._id,
    });
    toast.success(`Table ${table.name} reopened`);
  }
  function newClose() {
    setIsOrderPaymentModalOpen(true);
  }
  const date = table.date;
  const startHour = format(new Date(), "HH:mm");

  const gameplayTemplate: Partial<Gameplay> = {
    date,
    location: table.location as number,
    playerCount: table.playerCount,
    startHour,
    mentor: mentors[0],
  };

  function updateTableHandler(event: FormEvent<HTMLInputElement>) {
    const target = event.target as HTMLInputElement;
    if (!target.value) return;
    updateTable({
      id: table._id,
      updates: { [target.name]: target.value },
    });
    toast.success(`Table ${table.name} updated`);
  }

  function editGameplay(gameplay: Gameplay) {
    setSelectedGameplay(gameplay);
    setIsEditGameplayDialogOpen(true);
  }

  function handleTableCancel() {
    if (!table._id) return;
    if (table?.orders) {
      const hasActiveOrders = table.orders.some((order) => {
        return (order as Order)?.status !== OrderStatus.CANCELLED;
      });

      if (hasActiveOrders) {
        toast.error(t("Table has active orders"));
        setIsDeleteConfirmationDialogOpen(false);
        return;
      }
    }
    updateTable({
      id: table._id,
      updates: { status: TableStatus.CANCELLED },
    });

    setIsDeleteConfirmationDialogOpen(false);
  }

  return (
    <div className="bg-white rounded-md shadow sm:h-auto break-inside-avoid mb-4 group __className_a182b8">
      <div
        className={`${bgColor} rounded-tl-md rounded-tr-md px-4 lg:px-6 lg:py-4 py-6 flex items-center justify-between mb-2`}
      >
        <p className="text-base font-semibold cursor-pointer w-full">
          <EditableText
            name="name"
            text={table.name}
            onUpdate={updateTableHandler}
          />
        </p>
        <div className="justify-end w-3/4 gap-2 flex lg:hidden lg:group-hover:flex ">
          {!table.finishHour && !table?.isOnlineSale && (
            <Tooltip content={t("Add Gameplay")}>
              <span className="text-{8px}">
                <CardAction onClick={createGameplay} IconComponent={PlusIcon} />
              </span>
            </Tooltip>
          )}
          {!table.finishHour && (
            <Tooltip content={t("Add Order")}>
              <span className="text-{8px}">
                <CardAction
                  onClick={() => {
                    setSelectedTable(table);
                    setIsCreateOrderDialogOpen(true);
                  }}
                  IconComponent={MdBorderColor}
                />
              </span>
            </Tooltip>
          )}
          {!table.finishHour && (
            <Tooltip content={t("Check")}>
              <span className="text-{8px}">
                <CardAction
                  // onClick={() => setIsCloseConfirmationDialogOpen(true)}
                  onClick={() => newClose()}
                  IconComponent={IoReceipt}
                />
              </span>
            </Tooltip>
          )}
          {!table.finishHour &&
            table?.orders?.some((tableOrder) => {
              return (tableOrder as Order)?.status === OrderStatus.READYTOSERVE;
            }) && (
              <Tooltip content={t("Served")}>
                <span className="text-{8px}">
                  <CardAction
                    onClick={() => {
                      if (!table.orders || !user) return;
                      const tableReadyToServeOrders = table.orders?.filter(
                        (tableOrder) =>
                          (tableOrder as Order)?.status ===
                          OrderStatus.READYTOSERVE
                      );
                      if (
                        tableReadyToServeOrders?.length === 0 ||
                        !tableReadyToServeOrders
                      )
                        return;

                      updateMultipleOrders({
                        ids: tableReadyToServeOrders as number[],
                        updates: {
                          status: OrderStatus.SERVED,
                          deliveredAt: new Date(),
                          deliveredBy: user._id,
                        },
                      });
                    }}
                    IconComponent={MdBrunchDining}
                  />
                </span>
              </Tooltip>
            )}
          {table.finishHour && (
            <Tooltip content="Reopen">
              <span className="text-{8px}">
                <CardAction
                  onClick={() => reopenTableBack()}
                  IconComponent={LockOpenIcon}
                />
              </span>
            </Tooltip>
          )}
          <Tooltip content={t("Delete")}>
            <span>
              <CardAction
                onClick={() => setIsDeleteConfirmationDialogOpen(true)}
                IconComponent={TrashIcon}
              />
            </span>
          </Tooltip>
        </div>
      </div>
      <div className={`px-4 lg:px-3 md:pb-4 pb-8 gap-2`}>
        {/* start finish player count */}
        <div>
          <div className="flex gap-4 flex-row">
            <InputWithLabel
              name="startHour"
              label={t("Start Time")}
              type="time"
              value={table.startHour}
              onChange={updateTableHandler}
            />
            <InputWithLabel
              name="finishHour"
              label={t("End Time")}
              type="time"
              value={table.finishHour}
              onChange={updateTableHandler}
            />
          </div>
          <div className="flex flex-col gap-4">
            <InputWithLabel
              name="playerCount"
              label={t("Player Count")}
              type="number"
              defaultValue={table.playerCount}
              onChange={updateTableHandler}
            />
          </div>
        </div>
        {/* table gameplays */}
        {showAllGameplays && table?.gameplays?.length > 0 && (
          <div
            className={`${
              table.orders &&
              table?.orders?.length > 0 &&
              "pb-3 border-b-[1px] border-b-gray-300"
            }`}
          >
            <div className="flex flex-col space-y-2 mt-2">
              {table.gameplays.map((gameplay) => {
                return (
                  <GameplayCard
                    key={gameplay._id}
                    gameplay={gameplay}
                    editGameplay={editGameplay}
                    getGameName={getGameName}
                    getDuration={getDuration}
                  />
                );
              })}
            </div>
          </div>
        )}
        {/* table orders */}
        {table.orders && table?.orders?.length > 0 && showAllOrders && (
          <div className="flex flex-col gap-2 mt-2">
            {(table?.orders as Order[])?.map((order) => {
              if (
                order.status === OrderStatus.CANCELLED ||
                (!showServedOrders && order.status === OrderStatus.SERVED)
              )
                return null;
              return <OrderCard key={order?._id} order={order} table={table} />;
            })}
          </div>
        )}
      </div>
      {isGameplayDialogOpen && (
        <CreateGameplayDialog
          isOpen={isGameplayDialogOpen}
          close={() => setIsGameplayDialogOpen(false)}
          gameplay={selectedGameplay || gameplayTemplate}
          table={table}
          mentors={mentors}
          games={games}
        />
      )}
      {selectedGameplay && isEditGameplayDialogOpen && (
        <EditGameplayDialog
          isOpen={isEditGameplayDialogOpen}
          close={() => {
            setIsEditGameplayDialogOpen(false);
          }}
          gameplay={selectedGameplay}
          table={table}
          mentors={mentors}
          games={games}
        />
      )}
      <ConfirmationDialog
        isOpen={isDeleteConfirmationDialogOpen}
        close={() => setIsDeleteConfirmationDialogOpen(false)}
        confirm={handleTableCancel}
        title={t("Delete Table")}
        text="This table and gameplays in it will be deleted. Are you sure to continue?"
      />
      {isCreateOrderDialogOpen && selectedTable && (
        <GenericAddEditPanel
          isOpen={isCreateOrderDialogOpen}
          close={() => setIsCreateOrderDialogOpen(false)}
          inputs={orderInputs}
          formKeys={orderFormKeys}
          submitItem={createOrder as any}
          isBlurFieldClickCloseEnabled={false}
          setForm={setOrderForm}
          isCreateCloseActive={false}
          constantValues={{ quantity: 1 }}
          cancelButtonLabel="Close"
          anotherPanelTopClassName="grid grid-cols-1 md:grid-cols-2  overflow-scroll no-scrollbar w-5/6 md:w-1/2"
          anotherPanel={<OrderListForPanel table={table} />}
          submitFunction={() => {
            const selectedMenuItem = menuItems.find(
              (item) => item._id === orderForm.item
            );
            if (
              (
                user &&
                selectedMenuItem &&
                selectedTable &&
                (selectedMenuItem?.category as MenuCategory)
              )?.isAutoServed
            ) {
              createOrder({
                ...orderForm,
                location: selectedLocationId,
                table: selectedTable._id,
                unitPrice: orderForm?.isOnlinePrice
                  ? selectedMenuItem?.onlinePrice ?? selectedMenuItem.price
                  : selectedMenuItem.price,
                paidQuantity: 0,
                deliveredAt: new Date(),
                deliveredBy: user?._id,
                preparedAt: new Date(),
                preparedBy: user?._id,
                status: OrderStatus.AUTOSERVED,
              });
            }
            if (
              selectedMenuItem &&
              selectedTable &&
              !(selectedMenuItem?.category as MenuCategory)?.isAutoServed
            ) {
              createOrder({
                ...orderForm,
                location: selectedLocationId,
                table: selectedTable._id,
                unitPrice: orderForm?.isOnlinePrice
                  ? selectedMenuItem?.onlinePrice ?? selectedMenuItem.price
                  : selectedMenuItem.price,
                paidQuantity: 0,
              });
            }
            setOrderForm({
              item: 0,
              quantity: 0,
              note: "",
              discount: undefined,
              isOnlinePrice: false,
            });
          }}
          generalClassName="overflow-scroll md:rounded-l-none shadow-none mt-[-4rem] md:mt-0"
          topClassName="flex flex-col gap-2   "
        />
      )}
      {isOrderPaymentModalOpen && (
        <OrderPaymentModal
          orders={table.orders as Order[]}
          collections={collections}
          table={table}
          close={() => {
            setExpandedRows({});
            resetOrderContext();
            setIsOrderPaymentModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
