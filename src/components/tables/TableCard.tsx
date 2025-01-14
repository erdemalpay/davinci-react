import { LockOpenIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Tooltip } from "@material-tailwind/react";
import { format } from "date-fns";
import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoReceipt } from "react-icons/io5";
import { MdBorderColor, MdBrunchDining } from "react-icons/md";
import { RiFileTransferFill } from "react-icons/ri";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { useLocationContext } from "../../context/Location.context";
import { useOrderContext } from "../../context/Order.context";
import { useUserContext } from "../../context/User.context";
import {
  Game,
  Gameplay,
  MenuItem,
  Order,
  OrderDiscountStatus,
  OrderStatus,
  Table,
  TableStatus,
  TableTypes,
  TURKISHLIRA,
  User,
} from "../../types";
import { useGetAccountStocks } from "../../utils/api/account/stock";
import { useGetStockLocations } from "../../utils/api/location";
import { useGetCategories } from "../../utils/api/menu/category";
import { useGetKitchens } from "../../utils/api/menu/kitchen";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import {
  useCreateMultipleOrderMutation,
  useGetTableOrders,
  useOrderMutations,
  useTransferTableMutation,
  useUpdateMultipleOrderMutation,
} from "../../utils/api/order/order";
import { useGetOrderDiscounts } from "../../utils/api/order/orderDiscount";
import {
  useReopenTableMutation,
  useTableMutations,
} from "../../utils/api/table";
import { getItem } from "../../utils/getItem";
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
  tables: Table[];
}

export function TableCard({
  table,
  mentors,
  games,
  showAllGameplays = false,
  showAllOrders = false,
  showServedOrders = false,
  tables,
}: TableCardProps) {
  const { t } = useTranslation();
  const [isGameplayDialogOpen, setIsGameplayDialogOpen] = useState(false);
  const [
    isTableNameEditConfirmationDialogOpen,
    setIsTableNameEditConfirmationDialogOpen,
  ] = useState(false);
  const [newTableName, setNewTableName] = useState(table?.name);
  const [isEditGameplayDialogOpen, setIsEditGameplayDialogOpen] =
    useState(false);
  let tableOrders: Order[] = [];
  if (table?._id) {
    tableOrders = useGetTableOrders(table?._id);
  }
  const [isDeleteConfirmationDialogOpen, setIsDeleteConfirmationDialogOpen] =
    useState(false);
  const [isOrderPaymentModalOpen, setIsOrderPaymentModalOpen] = useState(false);
  const [selectedGameplay, setSelectedGameplay] = useState<Gameplay>();
  const { mutate: createMultipleOrder } = useCreateMultipleOrderMutation();
  const { updateTable } = useTableMutations();
  const { mutate: reopenTable } = useReopenTableMutation();
  const { mutate: transferTable } = useTransferTableMutation();
  const { selectedLocationId } = useLocationContext();
  const { createOrder } = useOrderMutations();
  const discounts = useGetOrderDiscounts()?.filter(
    (discount) => discount?.status !== OrderDiscountStatus.DELETED
  );
  const initialOrderForm = {
    item: 0,
    quantity: 0,
    note: "",
    category: "",
    discount: undefined,
    discountNote: "",
    isOnlinePrice: false,
    stockLocation: table?.isOnlineSale ? 6 : selectedLocationId,
  };
  const locations = useGetStockLocations();
  const stocks = useGetAccountStocks();
  const categories = useGetCategories();
  const kitchens = useGetKitchens();
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const [isTableTransferOpen, setIsTableTransferOpen] = useState(false);
  const { orderCreateBulk, setOrderCreateBulk } = useOrderContext();
  const { resetOrderContext } = useOrderContext();
  const { setExpandedRows } = useGeneralContext();
  const { user } = useUserContext();
  const { mutate: updateMultipleOrders } = useUpdateMultipleOrderMutation();
  const [orderForm, setOrderForm] = useState(initialOrderForm);
  const [tableTransferForm, setTableTransferForm] = useState({
    table: "",
  });
  const menuItems = useGetMenuItems();
  const menuItemStockQuantity = (item: MenuItem, location: number) => {
    if (item?.matchedProduct) {
      const stock = stocks?.find((stock) => {
        return (
          stock.product === item.matchedProduct && stock.location === location
        );
      });
      return stock?.quantity ?? 0;
    }
    return 0;
  };
  const menuItemOptions = menuItems
    ?.filter((menuItem) => {
      return (
        !orderForm.category || menuItem.category === Number(orderForm.category)
      );
    })
    ?.filter((menuItem) => menuItem?.locations?.includes(selectedLocationId))
    ?.filter((menuItem) =>
      table?.isOnlineSale
        ? getItem(menuItem.category, categories)?.isOnlineOrder
        : true
    )
    ?.map((menuItem) => {
      return {
        value: menuItem?._id,
        label: menuItem?.name + " (" + menuItem.price + TURKISHLIRA + ")",
      };
    });

  const filteredDiscounts = discounts.filter((discount) =>
    table?.isOnlineSale ? discount?.isOnlineOrder : discount?.isStoreOrder
  );
  const isOnlinePrice = () => {
    const menuItem = menuItems?.find((item) => item._id === orderForm.item);
    if (getItem(menuItem?.category, categories)?.isOnlineOrder) {
      return true;
    }
    return false;
  };
  const orderInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "category",
      label: t("Category"),
      options: categories?.map((category) => {
        return {
          value: category._id,
          label: category.name,
        };
      }),
      invalidateKeys: [{ key: "item", defaultValue: 0 }],
      placeholder: t("Category"),
      required: false,
      isDisabled: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "item",
      label: t("Product"),
      options: menuItemOptions?.map((option) => {
        return {
          value: option.value,
          label: option.label,
        };
      }),
      invalidateKeys: [
        { key: "discount", defaultValue: undefined },
        { key: "discountNote", defaultValue: "" },
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
              return getItem(
                menuItem?.category,
                categories
              )?.discounts?.includes(discount._id);
            })
            ?.map((option) => {
              return {
                value: option?._id,
                label: option?.name,
              };
            })
        : [],
      invalidateKeys: [{ key: "discountNote", defaultValue: "" }],
      placeholder: t("Discount"),
      isAutoFill: false,
      required: false,
    },
    {
      type: InputTypes.TEXT,
      formKey: "discountNote",
      label: t("Discount Note"),
      placeholder:
        orderForm?.discount &&
        discounts?.find((discount) => discount._id === orderForm.discount)?.note
          ? discounts?.find((discount) => discount._id === orderForm.discount)
              ?.note
          : t("What is the reason for the discount?"),
      required:
        (orderForm?.discount &&
          discounts?.find((discount) => discount._id === orderForm.discount)
            ?.isNoteRequired) ??
        false,
      isDisabled:
        (orderForm?.discount &&
          !discounts?.find((discount) => discount._id === orderForm.discount)
            ?.isNoteRequired) ??
        true,
      isOnClearActive: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "stockLocation",
      label: t("Stock Location"),
      options: locations?.map((input) => {
        const menuItem = menuItems?.find((item) => item._id === orderForm.item);
        const stockQuantity = menuItem
          ? menuItemStockQuantity(menuItem, input._id)
          : null;
        return {
          value: input._id,
          label:
            input.name +
            (menuItem?.itemProduction && menuItem.itemProduction.length > 0
              ? ` (${t("Stock")}: ${stockQuantity})`
              : ""),
        };
      }),
      placeholder: t("Stock Location"),
      required: true,
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
    { key: "category", type: FormKeyTypeEnum.STRING },
    { key: "item", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
    { key: "discount", type: FormKeyTypeEnum.NUMBER },
    { key: "discountNote", type: FormKeyTypeEnum.STRING },
    { key: "stockLocation", type: FormKeyTypeEnum.NUMBER },
    { key: "isOnlinePrice", type: FormKeyTypeEnum.BOOLEAN },
    { key: "note", type: FormKeyTypeEnum.STRING },
  ];
  const tableTransferInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "table",
      label: t("Table"),
      options: tables
        ?.filter(
          (filteredTable) =>
            filteredTable._id !== table._id && !filteredTable?.finishHour
        )
        ?.map((tableMap) => {
          return {
            value: tableMap?._id,
            label: tableMap?.name,
          };
        }),
      placeholder: t("Table"),
      required: true,
    },
  ];
  const tableTransferFormKeys = [
    { key: "table", type: FormKeyTypeEnum.STRING },
  ];

  const bgColor = table.finishHour
    ? "bg-gray-500"
    : tableOrders?.some(
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
    toast.success(`Table ${table?.name} reopened`);
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
    if (tableOrders) {
      const hasActiveOrders = tableOrders?.some((order) => {
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
  const handleOrderObject = () => {
    const selectedMenuItem = getItem(orderForm?.item, menuItems);
    const selectedMenuItemCategory = getItem(
      selectedMenuItem?.category,
      categories
    );
    const selectedItemKitchen = getItem(
      selectedMenuItemCategory?.kitchen,
      kitchens
    );
    const isOrderConfirmationRequired =
      selectedItemKitchen?.isConfirmationRequired;
    if (
      (user && selectedMenuItem && table && selectedMenuItemCategory)
        ?.isAutoServed
    ) {
      return {
        ...orderForm,
        createdAt: new Date(),
        location: selectedLocationId,
        table: table._id,
        unitPrice: orderForm?.isOnlinePrice
          ? selectedMenuItem?.onlinePrice ?? selectedMenuItem.price
          : selectedMenuItem.price,
        paidQuantity: 0,
        deliveredAt: new Date(),
        deliveredBy: user?._id,
        preparedAt: new Date(),
        preparedBy: user?._id,
        status: OrderStatus.AUTOSERVED,
        kitchen: selectedMenuItemCategory?.kitchen,
        stockLocation: orderForm?.stockLocation ?? selectedLocationId,
        tableDate: new Date(table.date),
      };
    }

    // Check if the menu item is not automatically served
    if (selectedMenuItem && table && !selectedMenuItemCategory?.isAutoServed) {
      return {
        ...orderForm,
        location: selectedLocationId,
        table: table._id,
        status: isOrderConfirmationRequired
          ? OrderStatus.CONFIRMATIONREQ
          : OrderStatus.PENDING,
        unitPrice: orderForm?.isOnlinePrice
          ? selectedMenuItem?.onlinePrice ?? selectedMenuItem.price
          : selectedMenuItem.price,
        paidQuantity: 0,
        kitchen: selectedMenuItemCategory?.kitchen,
        stockLocation: orderForm?.stockLocation ?? selectedLocationId,
        tableDate: new Date(table.date),
      };
    }
    return null;
  };

  useEffect(() => {
    setOrderForm({
      ...orderForm,
      stockLocation: selectedLocationId,
    });
  }, [selectedLocationId]);

  return (
    <div className="bg-white rounded-md shadow sm:h-auto break-inside-avoid mb-4 group __className_a182b8">
      <div
        className={`${bgColor} rounded-tl-md rounded-tr-md px-4 lg:px-6 lg:py-4 py-6 flex items-center justify-between mb-2 max-h-12`}
      >
        <p className="text-base font-semibold cursor-pointer w-full">
          <EditableText
            name="name"
            text={table.name}
            onUpdate={(e: FormEvent<HTMLInputElement>) => {
              const target = e.target as HTMLInputElement;
              if (!target.value) return;
              setNewTableName(target.value);
              setIsTableNameEditConfirmationDialogOpen(true);
            }}
          />
        </p>
        <div className="justify-end w-3/4 gap-6 sm:gap-2  flex lg:hidden lg:group-hover:flex ">
          {!table.finishHour && !table?.isOnlineSale && (
            <Tooltip content={t("Add Gameplay")}>
              <span>
                <CardAction onClick={createGameplay} IconComponent={PlusIcon} />
              </span>
            </Tooltip>
          )}
          {!table.finishHour && (
            <Tooltip content={t("Add Order")}>
              <span>
                <CardAction
                  onClick={() => {
                    setIsCreateOrderDialogOpen(true);
                  }}
                  IconComponent={MdBorderColor}
                />
              </span>
            </Tooltip>
          )}

          <Tooltip content={t("Check")}>
            <span>
              <CardAction
                // onClick={() => setIsCloseConfirmationDialogOpen(true)}
                onClick={() => newClose()}
                IconComponent={IoReceipt}
              />
            </span>
          </Tooltip>

          {!table.finishHour &&
            tableOrders?.some((tableOrder) => {
              return (tableOrder as Order)?.status === OrderStatus.READYTOSERVE;
            }) && (
              <Tooltip content={t("Served")}>
                <span>
                  <CardAction
                    onClick={() => {
                      if (!tableOrders || !user) return;
                      const tableReadyToServeOrders = tableOrders
                        ?.filter(
                          (tableOrder) =>
                            (tableOrder as Order)?.status ===
                            OrderStatus.READYTOSERVE
                        )
                        .map((tableOrder) => tableOrder?._id);
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
              <span>
                <CardAction
                  onClick={() => reopenTableBack()}
                  IconComponent={LockOpenIcon}
                />
              </span>
            </Tooltip>
          )}
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
              tableOrders &&
              tableOrders?.length > 0 &&
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
        {tableOrders && tableOrders?.length > 0 && showAllOrders && (
          <div className="flex flex-col gap-2 mt-2 ">
            {(tableOrders as Order[])?.map((order) => {
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
      {isCreateOrderDialogOpen && (
        <GenericAddEditPanel
          isOpen={isCreateOrderDialogOpen}
          close={() => {
            setOrderCreateBulk([]);
            setIsCreateOrderDialogOpen(false);
          }}
          inputs={orderInputs}
          formKeys={orderFormKeys}
          submitItem={createOrder as any}
          isConfirmationDialogRequired={() => {
            const menuItem = menuItems?.find(
              (item) => item._id === orderForm.item
            );
            const category = categories?.find(
              (category) => category._id === menuItem?.category
            );
            const stockQuantity = menuItem
              ? menuItemStockQuantity(menuItem, orderForm.stockLocation)
              : null;
            if (!category?.isOnlineOrder) {
              return false;
            }
            return !stockQuantity || stockQuantity < orderForm.quantity;
          }}
          confirmationDialogHeader={t("Stock Quantity Warning")}
          confirmationDialogText={t(
            "Stock Quantity is not enough. Do you want to continue?"
          )}
          setForm={setOrderForm}
          isCreateCloseActive={false}
          optionalCreateButtonActive={orderCreateBulk?.length > 0}
          constantValues={{
            quantity: 1,
            stockLocation: table?.isOnlineSale ? 6 : selectedLocationId,
          }}
          cancelButtonLabel="Close"
          anotherPanelTopClassName="h-full sm:h-auto flex flex-col gap-2 sm:gap-0  sm:grid grid-cols-1 md:grid-cols-2  w-5/6 md:w-1/2 overflow-scroll no-scrollbar sm:overflow-visible  "
          anotherPanel={<OrderListForPanel table={table} />}
          additionalButtons={[
            {
              label: "Add",
              isInputRequirementCheck: true,
              isInputNeedToBeReset: true,
              onClick: () => {
                const orderObject = handleOrderObject();
                if (orderObject) {
                  setOrderCreateBulk([...orderCreateBulk, orderObject]);
                }
                setOrderForm(initialOrderForm);
              },
            },
          ]}
          submitFunction={() => {
            // creating single order
            if (orderCreateBulk === null || orderCreateBulk.length === 0) {
              const orderObject = handleOrderObject();
              if (orderObject) {
                createOrder(orderObject);
              }
            } else {
              if (orderForm?.item) {
                const orderObject = handleOrderObject();
                if (orderObject) {
                  createMultipleOrder({
                    orders: [...orderCreateBulk, orderObject],
                    table: table,
                  });
                  setOrderForm(initialOrderForm);
                  setOrderCreateBulk([]);
                  return;
                }
              }
              createMultipleOrder({
                orders: orderCreateBulk,
                table: table,
              });
            }
            setOrderForm(initialOrderForm);
            setOrderCreateBulk([]);
            if (table.type === TableTypes.TAKEOUT) {
              setIsCreateOrderDialogOpen(false);
            }
          }}
          generalClassName=" md:rounded-l-none shadow-none mt-[-4rem] md:mt-0"
          topClassName="flex flex-col gap-2   "
        />
      )}

      {/* buttom buttons */}
      <div
        className={`${bgColor} rounded-bl-md rounded-br-md px-4 lg:px-6 lg:py-4 py-6 flex items-center justify-end mb-2  h-9`}
      >
        <div className="justify-end w-3/4 gap-6 sm:gap-2 flex lg:hidden lg:group-hover:flex ">
          <Tooltip content={t("Table Transfer")}>
            <span>
              <CardAction
                onClick={() => setIsTableTransferOpen(true)}
                IconComponent={RiFileTransferFill}
              />
            </span>
          </Tooltip>
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

      {isOrderPaymentModalOpen && (
        <OrderPaymentModal
          tableId={table._id}
          tables={tables}
          close={() => {
            setExpandedRows({});
            resetOrderContext();
            setIsOrderPaymentModalOpen(false);
          }}
        />
      )}
      {isTableTransferOpen && (
        <GenericAddEditPanel
          isOpen={isTableTransferOpen}
          close={() => setIsTableTransferOpen(false)}
          inputs={tableTransferInputs}
          formKeys={tableTransferFormKeys}
          submitItem={transferTable as any}
          submitFunction={() => {
            transferTable({
              orders: tableOrders,
              oldTableId: table._id,
              transferredTableId: Number(tableTransferForm.table),
            });
          }}
          isCreateConfirmationDialogExist={true}
          createConfirmationDialogHeader={t("Transfer Table")}
          createConfirmationDialogText={t(
            "Are you sure to transfer the table?"
          )}
          setForm={setTableTransferForm}
          topClassName="flex flex-col gap-2 "
        />
      )}
      {isTableNameEditConfirmationDialogOpen && (
        <ConfirmationDialog
          isOpen={isTableNameEditConfirmationDialogOpen}
          close={() => setIsTableNameEditConfirmationDialogOpen(false)}
          confirm={() => {
            updateTable({
              id: table._id,
              updates: {
                name: newTableName,
              },
            });
            setIsTableNameEditConfirmationDialogOpen(false);
          }}
          title={t("Edit Table Name")}
          text={t("Are you sure to change the table name?")}
        />
      )}
    </div>
  );
}
