import { LockOpenIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Tooltip } from "@material-tailwind/react";
import { format } from "date-fns";
import {
  FormEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { BsWrenchAdjustableCircle } from "react-icons/bs";
import { IoCloseOutline, IoReceipt } from "react-icons/io5";
import {
  MdBorderColor,
  MdBrunchDining,
  MdFlashOn,
  MdOutlineAddCircleOutline,
} from "react-icons/md";
import { RiFileTransferFill } from "react-icons/ri";
import { toast } from "react-toastify";
import { useDataContext } from "../../context/Data.context";
import { useGeneralContext } from "../../context/General.context";
import { useLocationContext } from "../../context/Location.context";
import { useOrderContext } from "../../context/Order.context";
import { useOrderTaker } from "../../hooks/useOrderTaker";
import {
  Gameplay,
  OnlineLocationId,
  Order,
  OrderCollection,
  OrderStatus,
  Table,
  TableTypes,
  User,
} from "../../types";
import { useGetActiveButtonCalls } from "../../utils/api/buttonCall";
import {
  useCombineTableMutation,
  useGetPopularItemsLast30Days,
  useOrderMutations,
  useTransferTableMutations,
  useUpdateMultipleOrderMutation,
} from "../../utils/api/order/order";
import {
  useReopenTableMutation,
  useTableMutations,
} from "../../utils/api/table";
import { getItem } from "../../utils/getItem";
import { getDuration } from "../../utils/time";
import { CardAction } from "../common/CardAction";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import { InputWithLabel } from "../common/InputWithLabel";
import OrderPaymentModal from "../orders/orderPayment/OrderPaymentModal";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import { CreateGameplayDialog } from "./CreateGameplayDialog";
import { EditGameplayDialog } from "./EditGameplayDialog";
import {
  getActivityTableWithGmCall,
  getGameplayDefaultsFromCall,
} from "./gameplayDefaults";
import GameplayCard from "./GameplayCard";
import OrderCard from "./OrderCard";
import OrderComposer from "./orderComposer/OrderComposer";
import { useGetMemberships } from "../../utils/api/membership";

export interface TableCardProps {
  table: Table;
  mentors: User[];
  showAllGameplays?: boolean;
  showAllOrders?: boolean;
  showServedOrders?: boolean;
  tables: Table[];
  // This table's orders and collections of the day.
  tableOrders: Order[];
  tableCollections: OrderCollection[];
}

// Memoized: with its own orders as props, a card re-renders when something
// of this table changes, not on every order of the cafe.
export const TableCard = memo(TableCardComponent);

function TableCardComponent({
  table,
  mentors,
  showAllGameplays = false,
  showAllOrders = false,
  showServedOrders = false,
  tables,
  tableOrders,
  tableCollections,
}: TableCardProps) {
  const {
    menuItems,
    categories,
    games,
    kitchens,
    storeLocations,
    user,
    visits = [],
  } = useDataContext();
  const memberships = useGetMemberships();
  const { t } = useTranslation();
  const [isGameplayDialogOpen, setIsGameplayDialogOpen] = useState(false);
  const [
    isTableNameEditConfirmationDialogOpen,
    setIsTableNameEditConfirmationDialogOpen,
  ] = useState(false);
  const [isEditGameplayDialogOpen, setIsEditGameplayDialogOpen] =
    useState(false);
  const [isDeleteConfirmationDialogOpen, setIsDeleteConfirmationDialogOpen] =
    useState(false);
  const [isOrderPaymentModalOpen, setIsOrderPaymentModalOpen] = useState(false);
  const [isAddActivityTableOpen, setIsAddActivityTableOpen] = useState(false);
  const [selectedGameplay, setSelectedGameplay] = useState<Gameplay>();
  const { updateTable, deleteTable } = useTableMutations();
  const { mutate: reopenTable } = useReopenTableMutation();
  const { mutate: combineTable } = useCombineTableMutation();
  const { mutate: transferTable } = useTransferTableMutations();
  const { selectedLocationId } = useLocationContext();
  const { createOrder } = useOrderMutations();
  const { orderTakerInputs, orderTakerFormKeys } = useOrderTaker();
  const inactiveCategories = useMemo(() => {
    return categories?.filter((category) => !category.active) || [];
  }, [categories]);
  const inactiveCategoriesWithKitchens = useMemo(() => {
    if (!kitchens) return [];
    return (
      inactiveCategories?.filter(
        (category) =>
          category.kitchen &&
          kitchens.some(
            (k) =>
              k._id === category.kitchen &&
              k?.selectedUsers &&
              k?.selectedUsers?.length > 0
          )
      ) || []
    );
  }, [inactiveCategories, kitchens]);
  const inactiveCategoriesIds = useMemo(() => {
    return inactiveCategories.map((c) => c._id);
  }, [inactiveCategories]);
  const [
    isTableCardCreateOrderDialogOpen,
    setIsTableCardCreateOrderDialogOpen,
  ] = useState(false);
  const [isQuickOrderDialogOpen, setIsQuickOrderDialogOpen] = useState(false);
  const [isTableCombineOpen, setIsTableCombineOpen] = useState(false);
  const [isTableTransferOpen, setIsTableTransferOpen] = useState(false);
  const { resetOrderContext } = useOrderContext();
  const { setExpandedRows } = useGeneralContext();
  const { mutate: updateMultipleOrders } = useUpdateMultipleOrderMutation();
  const [quickOrderForm, setQuickOrderForm] = useState({
    item: 0,
    quantity: 1,
    isOnlinePrice: false,
    location: table?.isOnlineSale ? OnlineLocationId : selectedLocationId,
    stockLocation: table?.isOnlineSale ? 6 : selectedLocationId,
    activityPlayer: "",
    activityTableName: "",
  });
  const [tableCombineForm, setTableCombineForm] = useState({
    table: "",
  });
  const [tableTransferForm, setTableTransferForm] = useState({
    table: "",
  });
  const [activityTableForm, setActivityTableForm] = useState({
    name: [],
  });
  const popularOrderItems = useGetPopularItemsLast30Days();
  const quickOrderItemOptions = useMemo(() => {
    if (!menuItems) {
      return [];
    }

    return menuItems
      .filter((menuItem) => {
        if (inactiveCategoriesIds.includes(menuItem.category)) {
          return false;
        }

        if (!menuItem?.locations?.includes(selectedLocationId)) {
          return false;
        }

        if (
          table?.isOnlineSale &&
          !(categories
            ? getItem(menuItem.category, categories)?.isOnlineOrder
            : false)
        ) {
          return false;
        }

        const category = categories
          ? getItem(menuItem.category, categories)
          : undefined;
        if (category?.isLimitedTime && menuItem.endDate) {
          const today = new Date();
          const endDate = new Date(menuItem.endDate);
          if (today > endDate) {
            return false;
          }
        }

        return true;
      })
      .map((menuItem) => ({
        value: menuItem?._id,
        label: menuItem?.name,
      }));
  }, [
    menuItems,
    selectedLocationId,
    table?.isOnlineSale,
    categories,
    inactiveCategoriesIds,
  ]);
  const filteredPopularOrderItems = useMemo(() => {
    return popularOrderItems.filter((popularItem) =>
      quickOrderItemOptions.some((option) => option.value === popularItem.value)
    );
  }, [popularOrderItems, quickOrderItemOptions]);
  const activeTables = useMemo(
    () => tables.filter((t) => !t.finishHour),
    [tables]
  );
  const inactiveTableInputs = useMemo(() => {
    if (!storeLocations) return [];
    const loc = storeLocations.find((l) => l._id === selectedLocationId);
    return (
      loc?.tableNames
        ?.filter((name) => !activeTables.some((t) => t.name === name))
        .map((name) => ({ value: name, label: name })) ?? []
    );
  }, [storeLocations, selectedLocationId, activeTables]);

  const activityTableInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "name",
        label: t("Name"),
        options: storeLocations
          ?.find((location) => location._id === selectedLocationId)
          ?.tableNames?.filter((t) => {
            return !tables.find(
              (table) =>
                (table.name === t || table?.tables?.includes(t)) &&
                !table?.finishHour
            );
          })
          ?.sort((a, b) => Number(a) - Number(b))
          ?.map((t, index) => {
            return {
              value: t,
              label: t,
            };
          }),
        placeholder: t("Name"),
        isSortDisabled: true,
        isMultiple: true,
        required: true,
      },
    ],
    [storeLocations, selectedLocationId, tables, t]
  );
  const activityTableFormKeys = [{ key: "name", type: FormKeyTypeEnum.STRING }];
  const isMobile = useMemo(() => window.innerWidth <= 768, []);

  const quickOrderInputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "activityPlayer",
        placeholder: t("Player Number"),
        required: table?.type === TableTypes.ACTIVITY,
        isDisabled: table?.type !== TableTypes.ACTIVITY,
        isOnClearActive: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "activityTableName",
        label: t("Table"),
        options: table.tables?.map((tableName) => ({
          value: tableName,
          label: tableName,
        })),
        placeholder: t("Table"),
        required: table?.type === TableTypes.ACTIVITY,
        isDisabled: table?.type !== TableTypes.ACTIVITY,
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
        isTopFlexRow: true,
      },
      {
        type: InputTypes.QUICKSELECT,
        formKey: "item",
        placeholder: t("Product"),
        quickOptions: filteredPopularOrderItems,
        allOptions: quickOrderItemOptions,
        isSelectAbove: true,
        required: true,
        isSelectAlwaysVisible: true,
        gridRow: isMobile ? 5 : 3,
        gridCol: isMobile ? 3 : 5,
      },
    ],
    [t, filteredPopularOrderItems, quickOrderItemOptions, isMobile, table]
  );
  const quickOrderFormKeys = [
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
    { key: "item", type: FormKeyTypeEnum.NUMBER },
    { key: "activityPlayer", type: FormKeyTypeEnum.STRING },
    { key: "activityTableName", type: FormKeyTypeEnum.STRING },
  ];
  const tableCombineInputs = useMemo(
    () => [
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
    ],
    [tables, table, t]
  );
  const tableCombineFormKeys = [{ key: "table", type: FormKeyTypeEnum.STRING }];
  const tableTransferInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "table",
        label: t("Table"),
        options: inactiveTableInputs,
        placeholder: t("Table"),
        required: true,
      },
    ],
    [inactiveTableInputs, t]
  );
  const tableTransferFormKeys = [
    { key: "table", type: FormKeyTypeEnum.STRING },
  ];
  const bgColor = useMemo(() => {
    if (table.finishHour) return "bg-gray-500";
    if (
      tableOrders?.some(
        (tableOrder) =>
          (tableOrder as Order)?.status === OrderStatus.READYTOSERVE
      )
    )
      return "bg-orange-200";
    return "bg-gray-200";
  }, [table.finishHour, tableOrders]);

  const createGameplay = useCallback(() => {
    setSelectedGameplay(undefined);
    setIsGameplayDialogOpen(true);
  }, []);

  const getGameName = useCallback(
    (id: number) => {
      if (!games) return "";
      const game = games.find((game) => game._id === id);
      return game?.name || "";
    },
    [games]
  );

  const reopenTableBack = useCallback(() => {
    reopenTable({
      id: table._id,
    });
    toast.success(
      t("Table {{tableName}} reopened", { tableName: table?.name })
    );
  }, [reopenTable, table, t]);

  const newClose = useCallback(() => {
    setIsOrderPaymentModalOpen(true);
  }, []);

  const activeButtonCalls = useGetActiveButtonCalls();
  const activityTableName = useMemo(
    () =>
      table.type === TableTypes.ACTIVITY
        ? getActivityTableWithGmCall(activeButtonCalls, table.tables ?? [])
        : undefined,
    [activeButtonCalls, table.type, table.tables]
  );
  const callDefaults = useMemo(
    () =>
      getGameplayDefaultsFromCall(
        activeButtonCalls,
        activityTableName ?? table.name
      ),
    [activeButtonCalls, activityTableName, table.name]
  );

  const gameplayTemplate = useMemo(() => {
    return {
      date: table.date,
      location: table.location as number,
      playerCount: table.playerCount,
      startHour: format(new Date(), "HH:mm"),
      mentor: callDefaults.mentor ?? mentors[0],
      ...(callDefaults.game && { game: callDefaults.game }),
      ...(activityTableName && { activityTableName }),
    };
  }, [
    table.date,
    table.location,
    table.playerCount,
    mentors,
    callDefaults,
    activityTableName,
  ]);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = useCallback(
    (event: FormEvent<HTMLInputElement>) => {
      const target = event.target as HTMLInputElement;
      const { name, value } = target;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (!value) {
          return;
        }

        updateTable({
          id: table._id,
          updates: { [name]: value },
        });

        toast.success(
          t("Table {{tableName}} updated", { tableName: table.name })
        );
      }, 800);
    },
    [updateTable, table, t]
  );

  const editGameplay = useCallback((gameplay: Gameplay) => {
    setSelectedGameplay(gameplay);
    setIsEditGameplayDialogOpen(true);
  }, []);

  const handleTableCancel = useCallback(() => {
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
    console.log("About to call deleteTable with id:", table._id);
    deleteTable(table._id);

    setIsDeleteConfirmationDialogOpen(false);
  }, [table._id, tableOrders, deleteTable, t]);

  const handleQuickOrderObject = () => {
    if (!menuItems || !categories) return null;
    const selectedMenuItem = getItem(quickOrderForm?.item, menuItems);
    const selectedMenuItemCategory = getItem(
      selectedMenuItem?.category,
      categories
    );
    const selectedItemKitchen = kitchens
      ? getItem(selectedMenuItemCategory?.kitchen, kitchens)
      : undefined;
    const isOrderConfirmationRequired =
      selectedItemKitchen?.isConfirmationRequired;

    if (!selectedMenuItem) {
      return null;
    }

    if (
      user &&
      (selectedMenuItemCategory?.isAutoServed || selectedMenuItem?.isAutoServed)
    ) {
      return {
        ...quickOrderForm,
        createdAt: new Date(),
        location: table?.isOnlineSale
          ? OnlineLocationId
          : quickOrderForm?.location ?? selectedLocationId,
        table: table._id,
        unitPrice: quickOrderForm?.isOnlinePrice
          ? selectedMenuItem?.onlinePrice ?? selectedMenuItem.price
          : selectedMenuItem.price,
        paidQuantity: 0,
        deliveredAt: new Date(),
        deliveredBy: user?._id,
        preparedAt: new Date(),
        preparedBy: user?._id,
        status: OrderStatus.AUTOSERVED,
        kitchen: selectedMenuItemCategory?.kitchen,
        stockLocation: quickOrderForm?.stockLocation ?? selectedLocationId,
        tableDate: new Date(table.date),
      };
    }

    if (user && selectedMenuItem?.isAutoPrepared) {
      return {
        ...quickOrderForm,
        createdAt: new Date(),
        location: table?.isOnlineSale
          ? OnlineLocationId
          : quickOrderForm?.location ?? selectedLocationId,
        table: table._id,
        unitPrice: quickOrderForm?.isOnlinePrice
          ? selectedMenuItem?.onlinePrice ?? selectedMenuItem.price
          : selectedMenuItem.price,
        paidQuantity: 0,
        status: OrderStatus.READYTOSERVE,
        kitchen: selectedMenuItemCategory?.kitchen,
        stockLocation: quickOrderForm?.stockLocation ?? selectedLocationId,
        tableDate: new Date(table.date),
      };
    }

    return {
      ...quickOrderForm,
      location: table?.isOnlineSale
        ? OnlineLocationId
        : quickOrderForm?.location ?? selectedLocationId,
      table: table._id,
      status: isOrderConfirmationRequired
        ? OrderStatus.CONFIRMATIONREQ
        : OrderStatus.PENDING,
      unitPrice: quickOrderForm?.isOnlinePrice
        ? selectedMenuItem?.onlinePrice ?? selectedMenuItem.price
        : selectedMenuItem.price,
      paidQuantity: 0,
      kitchen: selectedMenuItemCategory?.kitchen,
      stockLocation: quickOrderForm?.stockLocation ?? selectedLocationId,
      tableDate: new Date(table.date),
    };
  };

  useEffect(() => {
    setQuickOrderForm((prev) => ({
      ...prev,
      stockLocation: table?.isOnlineSale ? 6 : selectedLocationId,
      location: table?.isOnlineSale ? OnlineLocationId : selectedLocationId,
    }));
  }, [selectedLocationId, table?.isOnlineSale]);
  return (
    <div className="bg-white rounded-md shadow sm:h-auto break-inside-avoid mb-4 group __className_a182b8">
      <div
        className={`${bgColor} rounded-tl-md rounded-tr-md px-4 lg:px-6 lg:py-4 py-6 flex items-center justify-between mb-2 max-h-12`}
      >
        <p className="text-base font-semibold  w-full">{table.name}</p>
        <div className="justify-end w-3/4 gap-6 sm:gap-2  flex lg:hidden lg:group-hover:flex ">
          {!table.finishHour && !table?.isOnlineSale && (
            <Tooltip content={t("Add Gameplay")}>
              <span>
                <CardAction onClick={createGameplay} IconComponent={PlusIcon} />
              </span>
            </Tooltip>
          )}
          {!table.finishHour && (
            <Tooltip content={t("Quick Order")}>
              <span>
                <CardAction
                  onClick={() => {
                    setIsQuickOrderDialogOpen(true);
                  }}
                  IconComponent={MdFlashOn}
                />
              </span>
            </Tooltip>
          )}
          {!table.finishHour && (
            <Tooltip content={t("Add Order")}>
              <span>
                <CardAction
                  onClick={() => {
                    setIsTableCardCreateOrderDialogOpen(true);
                  }}
                  IconComponent={MdBorderColor}
                />
              </span>
            </Tooltip>
          )}

          <Tooltip content={t("Table Check")}>
            <span>
              <CardAction
                // onClick={() => setIsCloseConfirmationDialogOpen(true)}
                onClick={() => newClose()}
                IconComponent={IoReceipt}
              />
            </span>
          </Tooltip>

          {!table.finishHour &&
            tableOrders.some((tableOrder) => {
              return tableOrder.status === OrderStatus.READYTOSERVE;
            }) && (
              <Tooltip content={t("Served")}>
                <span>
                  <CardAction
                    onClick={() => {
                      if (!user) return;
                      const tableReadyToServeOrders = tableOrders
                        .filter(
                          (tableOrder) =>
                            tableOrder.status === OrderStatus.READYTOSERVE
                        )
                        .map((tableOrder) => tableOrder._id);
                      if (tableReadyToServeOrders.length === 0) return;
                      updateMultipleOrders({
                        ids: tableReadyToServeOrders,
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
            <Tooltip content={t("Reopen")}>
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
              onChange={handleInputChange}
            />
            {table?.finishHour && (
              <InputWithLabel
                name="finishHour"
                label={t("End Time")}
                type="time"
                value={table.finishHour}
                onChange={handleInputChange}
              />
            )}
          </div>
          <div className="flex flex-col gap-4">
            <InputWithLabel
              name="playerCount"
              label={t("Player Count")}
              type="number"
              value={table.playerCount}
              onChange={handleInputChange}
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
        {/* table tables for activity table type */}
        {table?.type === TableTypes.ACTIVITY && table?.tables && (
          <div
            className={`${
              table?.tables &&
              table?.tables?.length > 0 &&
              "pb-3 border-b-[1px] border-b-gray-300"
            }`}
          >
            <p className="text-gray-800 text-[13px]">{t("Tables")}</p>
            {/* tables */}
            <div className="flex flex-row flex-wrap gap-2 mt-2">
              {table.tables.map((tableName) => {
                return (
                  <div
                    key={tableName}
                    className="flex flex-row  gap-2 px-2 py-1 bg-gray-200 rounded-md"
                  >
                    <p className="text-sm font-semibold">{tableName}</p>
                    <ButtonTooltip content={t("Delete")}>
                      <IoCloseOutline
                        className="cursor-pointer font-bold"
                        onClick={() => {
                          const updatedTables = table?.tables?.filter(
                            (foundTable) => foundTable !== tableName
                          );
                          updateTable({
                            id: table._id,
                            updates: {
                              tables: updatedTables,
                            },
                          });
                        }}
                      />
                    </ButtonTooltip>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* table orders */}
        {tableOrders && tableOrders?.length > 0 && showAllOrders && (
          <div className="flex flex-col gap-2 mt-2 ">
            {(tableOrders as Order[])
              ?.filter((order) => {
                return !(
                  order?.status === OrderStatus.CANCELLED ||
                  (!showServedOrders && order.status === OrderStatus.SERVED)
                );
              })
              ?.map((order) => {
                return (
                  <OrderCard key={order?._id} order={order} table={table} />
                );
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
          games={games || []}
          visits={visits}
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
          games={games || []}
        />
      )}
      <ConfirmationDialog
        isOpen={isDeleteConfirmationDialogOpen}
        close={() => setIsDeleteConfirmationDialogOpen(false)}
        confirm={handleTableCancel}
        title={t("Delete Table")}
        text={t("DeleteTableMessage")}
      />

      {isTableCardCreateOrderDialogOpen && (
        <OrderComposer
          table={table}
          tableOrders={tableOrders}
          inactiveCategoryNames={inactiveCategoriesWithKitchens.map(
            (category) => category.name
          )}
          onClose={() => setIsTableCardCreateOrderDialogOpen(false)}
        />
      )}

      {isQuickOrderDialogOpen && (
        <GenericAddEditPanel
          isOpen={isQuickOrderDialogOpen}
          close={() => setIsQuickOrderDialogOpen(false)}
          inputs={[...orderTakerInputs, ...quickOrderInputs]}
          formKeys={[...orderTakerFormKeys, ...quickOrderFormKeys]}
          submitItem={() => undefined}
          submitFunction={() => {
            const orderObject = handleQuickOrderObject();
            if (orderObject) {
              createOrder(orderObject);
              setIsQuickOrderDialogOpen(false);
            }
          }}
          setForm={(item) => {
            setQuickOrderForm((prev) => ({ ...prev, ...(item as object) }));
          }}
          constantValues={{
            quantity: 1,
            stockLocation: table?.isOnlineSale ? 6 : selectedLocationId,
            location: table?.isOnlineSale
              ? OnlineLocationId
              : selectedLocationId,
            isOnlinePrice: false,
            isOnlineSale: table.isOnlineSale,
          }}
          topClassName="flex flex-col gap-0 "
          cancelButtonLabel="Cancel"
          generalClassName="overflow-scroll min-w-[60%] min-h-[60%]"
          buttonName={t("Create")}
          stickyFooterButtons={true}
        />
      )}

      {/* buttom buttons */}
      <div
        className={`${bgColor} rounded-bl-md rounded-br-md px-4 lg:px-6 lg:py-4 py-6 flex items-center justify-end mb-2  h-9`}
      >
        <div className="justify-end w-3/4 gap-6 sm:gap-2 flex lg:hidden lg:group-hover:flex ">
          {table.type !== TableTypes.ACTIVITY && (
            <Tooltip content={t("Table Combine")}>
              <span>
                <CardAction
                  onClick={() => setIsTableCombineOpen(true)}
                  IconComponent={BsWrenchAdjustableCircle}
                />
              </span>
            </Tooltip>
          )}
          {table.type !== TableTypes.ACTIVITY && (
            <Tooltip content={t("Table Transfer")}>
              <span>
                <CardAction
                  onClick={() => setIsTableTransferOpen(true)}
                  IconComponent={RiFileTransferFill}
                />
              </span>
            </Tooltip>
          )}
          {table.type === TableTypes.ACTIVITY && (
            <Tooltip content={t("Add Table")}>
              <span>
                <CardAction
                  onClick={() => setIsAddActivityTableOpen(true)}
                  IconComponent={MdOutlineAddCircleOutline}
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

      {isOrderPaymentModalOpen && (
        <OrderPaymentModal
          tableId={table._id}
          tables={tables}
          close={() => {
            setExpandedRows({});
            resetOrderContext();
            setIsOrderPaymentModalOpen(false);
          }}
          tableOrdersProp={tableOrders}
          tableCollectionsProp={tableCollections}
        />
      )}
      {isTableCombineOpen && (
        <GenericAddEditPanel
          isOpen={isTableCombineOpen}
          close={() => setIsTableCombineOpen(false)}
          inputs={tableCombineInputs}
          formKeys={tableCombineFormKeys}
          submitItem={combineTable as any}
          submitFunction={() => {
            combineTable({
              orders: tableOrders,
              oldTableId: table._id,
              transferredTableId: Number(tableCombineForm.table),
            });
          }}
          isCreateConfirmationDialogExist={true}
          createConfirmationDialogHeader={t("Transfer Combine")}
          createConfirmationDialogText={t("Are you sure to combine the table?")}
          setForm={setTableCombineForm}
          topClassName="flex flex-col gap-2 "
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
              transferredTableName: tableTransferForm.table,
            });
          }}
          isCreateConfirmationDialogExist={true}
          createConfirmationDialogHeader={t("Transfer Transfer")}
          createConfirmationDialogText={t(
            "Are you sure to transfer the table?"
          )}
          setForm={setTableTransferForm}
          topClassName="flex flex-col gap-2 "
        />
      )}
      {isAddActivityTableOpen && (
        <GenericAddEditPanel
          isOpen={isAddActivityTableOpen}
          close={() => setIsAddActivityTableOpen(false)}
          inputs={activityTableInputs}
          formKeys={activityTableFormKeys}
          submitItem={updateTable as any}
          submitFunction={() => {
            const newTableNames = [
              ...(table?.tables || []),
              ...activityTableForm.name,
            ];
            updateTable({
              id: table._id,
              updates: {
                tables: newTableNames,
              },
            });
          }}
          setForm={setActivityTableForm}
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
                name: table?.name,
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
