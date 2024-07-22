import {
  FlagIcon,
  LockOpenIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { Tooltip } from "@material-tailwind/react";
import { format } from "date-fns";
import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdBorderColor } from "react-icons/md";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { useLocationContext } from "../../context/Location.context";
import { useOrderContext } from "../../context/Order.context";
import { Game, Gameplay, OrderStatus, Table, User } from "../../types";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import {
  deleteTableOrders,
  useGetGivenDateOrders,
  useOrderMutations,
} from "../../utils/api/order/order";
import {
  useGetOrderPayments,
  useOrderPaymentMutations,
} from "../../utils/api/order/orderPayment";
import {
  useCloseTableMutation,
  useReopenTableMutation,
  useTableMutations,
} from "../../utils/api/table";
import { QuantityInput } from "../../utils/panelInputs";
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
}

export function TableCard({
  table,
  mentors,
  games,
  showAllGameplays = false,
  showAllOrders = false,
}: TableCardProps) {
  const { t } = useTranslation();
  const [isGameplayDialogOpen, setIsGameplayDialogOpen] = useState(false);
  const [isEditGameplayDialogOpen, setIsEditGameplayDialogOpen] =
    useState(false);
  const [isDeleteConfirmationDialogOpen, setIsDeleteConfirmationDialogOpen] =
    useState(false);
  const [isOrderPaymentModalOpen, setIsOrderPaymentModalOpen] = useState(false);
  const [isCloseConfirmationDialogOpen, setIsCloseConfirmationDialogOpen] =
    useState(false);
  const [selectedGameplay, setSelectedGameplay] = useState<Gameplay>();
  const { updateTable, deleteTable } = useTableMutations();
  const { mutate: closeTable } = useCloseTableMutation();
  const { mutate: reopenTable } = useReopenTableMutation();
  const { selectedLocationId } = useLocationContext();
  const { createOrder, deleteOrder, updateOrder } = useOrderMutations();
  const orderPayments = useGetOrderPayments();
  const { updateOrderPayment, createOrderPayment } = useOrderPaymentMutations();
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const orders = useGetGivenDateOrders();
  const { setPaymentAmount, setTemporaryOrders } = useOrderContext();
  const { setExpandedRows } = useGeneralContext();
  const [orderForm, setOrderForm] = useState({
    item: 0,
    quantity: 0,
    note: "",
    // discount: null,
  });
  const [selectedTable, setSelectedTable] = useState<Table>();
  const menuItems = useGetMenuItems();

  const menuItemOptions = menuItems?.map((menuItem) => {
    return {
      value: menuItem._id,
      label: menuItem.name,
    };
  });

  const orderInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "item",
      label: t("Item"),
      options: menuItemOptions.map((option) => {
        return {
          value: option.value,
          label: option.label,
        };
      }),
      placeholder: t("Item"),
      required: true,
    },
    QuantityInput(),
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
    { key: "note", type: FormKeyTypeEnum.STRING },
  ];
  const bgColor = table.finishHour
    ? "bg-gray-500"
    : table.orders?.some(
        (tableOrder) =>
          orders.find((order) => order._id === tableOrder)?.status ===
          OrderStatus.READYTOSERVE
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

  function finishTable() {
    closeTable({
      id: table._id,
      updates: { finishHour: format(new Date(), "HH:mm") },
    });
    setIsCloseConfirmationDialogOpen(false);
    toast.success(`Table ${table.name} closed`);
  }

  function reopenTableBack() {
    reopenTable({
      id: table._id,
    });
    toast.success(`Table ${table.name} reopened`);
  }
  function newClose() {
    const tableOpenPayment = orderPayments?.find(
      (orderPayment) => (orderPayment.table as Table)?._id === table?._id
    );

    // there is an open order payment so first check that the items inside are matched directly open it
    if (tableOpenPayment) {
      // check if all orders are included in the open order payment
      const isAllOrdersIncluded =
        table?.orders?.every((orderId) =>
          tableOpenPayment?.orders?.some(
            (paymentOrder) => paymentOrder.order === orderId
          )
        ) ?? false;
      //we are updating the open order payment to include all orders
      if (!isAllOrdersIncluded) {
        const missingOrders = table?.orders?.filter(
          (orderId) =>
            !tableOpenPayment?.orders?.some(
              (paymentOrder) => paymentOrder.order === orderId
            )
        );
        const newOrders = [
          ...(tableOpenPayment?.orders ?? []),
          ...(missingOrders?.map((orderId) => ({
            order: orderId,
            paidQuantity: 0,
            totalQuantity:
              orders?.find((o) => o._id === orderId)?.quantity ?? 0,
          })) ?? []),
        ];

        const newTotalAmount =
          tableOpenPayment.totalAmount +
          (missingOrders?.reduce((acc, order) => {
            const orderItem = orders?.find((o) => o._id === order);
            return acc + (orderItem?.totalPrice || 0);
          }, 0) ?? 0);

        updateOrderPayment({
          id: tableOpenPayment._id,
          updates: { orders: newOrders, totalAmount: newTotalAmount },
        });
      }
    }
    // there is no open order payment so create a new one
    else {
      const totalAmount = table?.orders?.reduce((acc, order) => {
        const orderItem = orders?.find((o) => o._id === order);
        return acc + (orderItem?.totalPrice || 0);
      }, 0);
      createOrderPayment({
        table: table._id,
        orders: table?.orders?.map((orderId) => ({
          order: orderId,
          paidQuantity: 0,
          totalQuantity: orders?.find((o) => o._id === orderId)?.quantity ?? 0,
        })),
        location: selectedLocationId,
        totalAmount: totalAmount,
        discountedTotalAmount: totalAmount,
      });
    }
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

  function handleTableDelete() {
    if (!table._id) return;
    deleteTable(table._id);
    if (table.orders && table?.orders?.length > 0) {
      deleteTableOrders({ ids: table?.orders });
    }
    setIsDeleteConfirmationDialogOpen(false);
    toast.success(`Table ${table.name} deleted`);
  }
  function getOrder(orderId: number) {
    return orders.find((order) => order._id === orderId);
  }

  return (
    <div
      className="bg-white rounded-md shadow sm:h-auto break-inside-avoid mb-4 group __className_a182b8"
      // style={{ lineHeight: "8px" }}
    >
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
        <div className="justify-end w-2/3 gap-4 flex lg:hidden lg:group-hover:flex ">
          {!table.finishHour && (
            <Tooltip content="Add gameplay">
              <span className="text-{8px}">
                <CardAction onClick={createGameplay} IconComponent={PlusIcon} />
              </span>
            </Tooltip>
          )}
          {!table.finishHour && (
            <Tooltip content="Add Order">
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
            <Tooltip content="Close">
              <span className="text-{8px}">
                <CardAction
                  // onClick={() => setIsCloseConfirmationDialogOpen(true)}
                  onClick={() => newClose()}
                  IconComponent={FlagIcon}
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
            {table?.orders.map((orderId) => {
              const order = getOrder(orderId);
              if (!order) return null;
              return <OrderCard key={order._id} order={order} table={table} />;
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
        confirm={handleTableDelete}
        title={t("Delete Table")}
        text="This table and gameplays in it will be deleted. Are you sure to continue?"
      />
      <ConfirmationDialog
        isOpen={isCloseConfirmationDialogOpen}
        close={() => setIsCloseConfirmationDialogOpen(false)}
        confirm={finishTable}
        title={t("Close Table")}
        text="Table is being closed. Are you sure?"
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
          cancelButtonLabel="Close"
          anotherPanelTopClassName="flex flex-row mx-auto flex-1 justify-center  "
          anotherPanel={<OrderListForPanel tableId={selectedTable._id} />}
          submitFunction={() => {
            const selectedMenuItem = menuItems.find(
              (item) => item._id === orderForm.item
            );
            if (selectedMenuItem && selectedTable) {
              createOrder({
                ...orderForm,
                location: selectedLocationId,
                table: selectedTable._id,
                unitPrice: selectedMenuItem.price,
                totalPrice: selectedMenuItem.price * orderForm.quantity,
              });
            }
            setOrderForm({
              item: 0,
              quantity: 0,
              note: "",
            });
          }}
          generalClassName="overflow-scroll rounded-l-none shadow-none"
          topClassName="flex flex-col gap-2  "
        />
      )}
      {isOrderPaymentModalOpen && (
        <OrderPaymentModal
          table={table}
          close={() => {
            setIsOrderPaymentModalOpen(false);
            setPaymentAmount("");
            setTemporaryOrders([]);
            setExpandedRows({});
            // setIsCollectionModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
