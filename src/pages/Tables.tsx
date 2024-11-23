import { subDays } from "date-fns";
import { isEqual } from "lodash";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { DateInput } from "../components/common/DateInput2";
import { Header } from "../components/header/Header";
import OrderPaymentModal from "../components/orders/orderPayment/OrderPaymentModal";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import InfoBox from "../components/panelComponents/FormElements/InfoBox";
import { H5 } from "../components/panelComponents/Typography";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import { ActiveVisitList } from "../components/tables/ActiveVisitList";
import { CreateTableDialog } from "../components/tables/CreateTableDialog";
import OrderTakeawayPanel from "../components/tables/OrderTakeawayPanel";
import { PreviousVisitList } from "../components/tables/PreviousVisitList";
import { TableCard } from "../components/tables/TableCard";
import { useDateContext } from "../context/Date.context";
import { useLocationContext } from "../context/Location.context";
import { useOrderContext } from "../context/Order.context";
import { useUserContext } from "../context/User.context";
import { Routes } from "../navigation/constants";
import {
  Game,
  Order,
  OrderDiscountStatus,
  OrderStatus,
  StockHistoryStatusEnum,
  TURKISHLIRA,
  Table,
  TableStatus,
  TableTypes,
  User,
} from "../types";
import { useGetAllAccountProducts } from "../utils/api/account/product";
import { useConsumptStockMutation } from "../utils/api/account/stock";
import { useGetAccountStockLocations } from "../utils/api/account/stockLocation";
import { useGetGames } from "../utils/api/game";
import { useGetCategories } from "../utils/api/menu/category";
import { useGetKitchens } from "../utils/api/menu/kitchen";
import { useGetMenuItems } from "../utils/api/menu/menu-item";
import { useGetTodayOrders, useOrderMutations } from "../utils/api/order/order";
import { useGetOrderDiscounts } from "../utils/api/order/orderDiscount";
import { useGetTables, useTableMutations } from "../utils/api/table";
import { useGetUsers } from "../utils/api/user";
import { useGetVisits } from "../utils/api/visit";
import { formatDate, isToday, parseDate } from "../utils/dateUtil";
import { getItem } from "../utils/getItem";
import { getStockLocation } from "../utils/getStockLocation";
import { QuantityInput } from "../utils/panelInputs";
import { sortTable } from "../utils/sort";
const Tables = () => {
  const { t } = useTranslation();
  const [isCreateTableDialogOpen, setIsCreateTableDialogOpen] = useState(false);
  const { setSelectedDate, selectedDate } = useDateContext();
  const [showAllTables, setShowAllTables] = useState(true);
  const [showAllGameplays, setShowAllGameplays] = useState(true);
  const { user } = useUserContext();
  const [showAllOrders, setShowAllOrders] = useState(true);
  const [isLossProductModalOpen, setIsLossProductModalOpen] = useState(false);
  const [showServedOrders, setShowServedOrders] = useState(true);
  const todayOrders = useGetTodayOrders();
  const locations = useGetAccountStockLocations();
  const { selectedLocationId } = useLocationContext();
  const [isConsumptModalOpen, setIsConsumptModalOpen] = useState(false);
  const { mutate: consumptStock } = useConsumptStockMutation();
  const { createTable } = useTableMutations();
  const navigate = useNavigate();
  const games = useGetGames();
  const visits = useGetVisits();
  const products = useGetAllAccountProducts();
  const kitchens = useGetKitchens();
  const categories = useGetCategories();
  const { createOrder } = useOrderMutations();
  const [isTakeAwayOrderModalOpen, setIsTakeAwayOrderModalOpen] =
    useState(false);
  const {
    orderCreateBulk,
    setOrderCreateBulk,
    isTakeAwayPaymentModalOpen,
    setIsTakeAwayPaymentModalOpen,
    takeawayTableId,
    setTakeawayTableId,
  } = useOrderContext();
  const menuItems = useGetMenuItems();
  const tables = useGetTables()
    .filter((table) => !table?.isOnlineSale)
    .filter((table) => table?.status !== TableStatus.CANCELLED);
  const users = useGetUsers();
  const initialOrderForm = {
    item: 0,
    quantity: 0,
    note: "",
    category: "",
    discount: undefined,
    discountNote: "",
    isOnlinePrice: false,
    stockLocation: selectedLocationId === 1 ? "bahceli" : "neorama",
  };
  const discounts = useGetOrderDiscounts()?.filter(
    (discount) => discount?.status !== OrderDiscountStatus.DELETED
  );
  const [orderForm, setOrderForm] = useState(initialOrderForm);

  const consumptInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "product",
      label: t("Product"),
      options: products?.map((product) => {
        return {
          value: product._id,
          label: product.name,
        };
      }),
      placeholder: t("Product"),
      required: true,
    },
    QuantityInput({ required: true }),
  ];
  const consumptFormKeys = [
    { key: "product", type: FormKeyTypeEnum.STRING },
    { key: "location", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const menuItemOptions = menuItems
    ?.filter((menuItem) => {
      return (
        !orderForm.category || menuItem.category === Number(orderForm.category)
      );
    })
    ?.filter((menuItem) => menuItem?.locations?.includes(selectedLocationId))
    ?.map((menuItem) => {
      return {
        value: menuItem?._id,
        label: menuItem?.name + " (" + menuItem.price + TURKISHLIRA + ")",
      };
    });
  useEffect(() => {
    console.log(takeawayTableId, isTakeAwayPaymentModalOpen);
  }, [takeawayTableId, isTakeAwayPaymentModalOpen]);
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
      isDisabled: true, // remove this line and make category selection visible again
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
      type: InputTypes.TEXTAREA,
      formKey: "note",
      label: t("Note"),
      placeholder: t("Note"),
      required: true,
    },
  ];
  const orderFormKeys = [
    { key: "category", type: FormKeyTypeEnum.STRING },
    { key: "item", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
    { key: "note", type: FormKeyTypeEnum.STRING },
  ];
  const isOnlinePrice = () => {
    const menuItem = menuItems?.find((item) => item._id === orderForm.item);
    if (getItem(menuItem?.category, categories)?.isOnlineOrder) {
      return true;
    }
    return false;
  };
  const orderInputsForTakeAway = [
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
      isDisabled: true, // remove this line and make category selection visible again
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
        ? discounts
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
      placeholder: t("Discount Note"),
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

  const orderFormKeysForTakeAway = [
    { key: "category", type: FormKeyTypeEnum.STRING },
    { key: "item", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
    { key: "discount", type: FormKeyTypeEnum.NUMBER },
    { key: "discountNote", type: FormKeyTypeEnum.STRING },
    { key: "location", type: FormKeyTypeEnum.STRING },
    { key: "isOnlinePrice", type: FormKeyTypeEnum.BOOLEAN },
    { key: "note", type: FormKeyTypeEnum.STRING },
  ];
  tables.sort(sortTable);
  // Sort users by name
  users.sort((a: User, b: User) => {
    if (a.name > b.name) {
      return 1;
    } else if (a.name < b.name) {
      return -1;
    } else {
      return 0;
    }
  });
  visits?.sort((a, b) => {
    const aUser = getItem(a.user, users);
    const bUser = getItem(b.user, users);
    const aUserRole = aUser?.role?.name as string;
    const bUserRole = bUser?.role?.name as string;
    if (aUserRole > bUserRole) {
      return 1;
    } else if (aUserRole < bUserRole) {
      return -1;
    } else if ((aUser?.name as string) > (bUser?.name as string)) {
      return 1;
    } else if ((aUser?.name as string) < (bUser?.name as string)) {
      return -1;
    } else {
      return 0;
    }
  });
  const defaultUser: User = users.find((user) => user._id === "dv") as User;
  const [mentors, setMentors] = useState<User[]>(
    defaultUser ? [defaultUser] : []
  );
  const activeTables = tables.filter((table) => !table?.finishHour);
  const activeTableCount = activeTables.length;
  const totalTableCount = tables.length;
  const activeCustomerCount = activeTables.reduce(
    (prev: number, curr: Table) => {
      return Number(prev) + Number(curr.playerCount);
    },
    0
  );
  const totalCustomerCount = tables.reduce((prev: number, curr: Table) => {
    return Number(prev) + Number(curr.playerCount);
  }, 0);
  const tableColumns: Table[][] = [[], [], [], []];
  (showAllTables ? tables : activeTables).forEach((table, index) => {
    tableColumns[index % 4].push(table);
  });
  useEffect(() => {
    const newMentors = defaultUser ? [defaultUser] : [];
    if (visits) {
      visits.forEach((visit) => {
        const user = getItem(visit.user, users) as User;
        if (user && !visit?.finishHour && !newMentors.includes(user)) {
          newMentors.push(user);
        }
      });
    }

    setMentors((mentors) => {
      if (isEqual(mentors, newMentors)) {
        return mentors;
      } else {
        return newMentors;
      }
    });
  }, [defaultUser, visits]);

  const handleDecrementDate = (prevDate: string) => {
    const date = parseDate(prevDate);
    const newDate = subDays(date, 1);
    setSelectedDate(formatDate(newDate));
  };

  const handleIncrementDate = (prevDate: string) => {
    const date = parseDate(prevDate);
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + 1);
    setSelectedDate(formatDate(newDate));
  };
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
    if ((user && selectedMenuItem && selectedMenuItemCategory)?.isAutoServed) {
      return {
        ...orderForm,
        location: selectedLocationId,
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
        stockLocation: selectedLocationId === 1 ? "bahceli" : "neorama",
      };
    }

    // Check if the menu item is not automatically served
    if (selectedMenuItem && !selectedMenuItemCategory?.isAutoServed) {
      return {
        ...orderForm,
        location: selectedLocationId,
        status: isOrderConfirmationRequired
          ? OrderStatus.CONFIRMATIONREQ
          : OrderStatus.PENDING,
        unitPrice: orderForm?.isOnlinePrice
          ? selectedMenuItem?.onlinePrice ?? selectedMenuItem.price
          : selectedMenuItem.price,
        paidQuantity: 0,
        kitchen: selectedMenuItemCategory?.kitchen,
        stockLocation: selectedLocationId === 1 ? "bahceli" : "neorama",
      };
    }
    return null;
  };
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);

    if (element) {
      const offset = -100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition + offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const bgColor = (table: Table) => {
    const tableOrders = todayOrders?.filter(
      (order) => (order.table as Table)?._id === table?._id
    );
    return tableOrders?.some(
      (tableOrder) => (tableOrder as Order)?.status === OrderStatus.READYTOSERVE
    )
      ? "bg-orange-200"
      : "bg-gray-100";
  };
  // filter out unfinished visits and only show one visit per user

  const seenUserIds = new Set<string>();
  const filteredVisits = visits.filter((visit) => {
    const isUnfinished = !visit.finishHour;
    const isUserNotSeen = !seenUserIds.has(visit.user);
    if (isUnfinished && isUserNotSeen) {
      seenUserIds.add(visit.user);
      return true;
    }

    return false;
  });
  const buttons: {
    label: string;
    onClick: () => void;
    hideOnMobile?: boolean;
  }[] = [
    {
      label: t("Take Away"),
      onClick: () => {
        setIsTakeAwayOrderModalOpen(true);
      },
      hideOnMobile: true,
    },
    {
      label: t("Loss Product"),
      onClick: () => {
        setIsLossProductModalOpen(true);
      },
      hideOnMobile: true,
    },
    {
      label: t("Product Consumption"),
      onClick: () => {
        setIsConsumptModalOpen(true);
      },
      hideOnMobile: true,
    },
    {
      label: t("Open Reservations"),
      onClick: () => {
        navigate(Routes.Reservations);
      },
    },
    {
      label: t("Add table"),
      onClick: () => {
        setIsCreateTableDialogOpen(true);
      },
    },
  ];
  const switchFilters: {
    label: string;
    checked: boolean;
    onChange: (value: boolean) => void;
  }[] = [
    {
      label: t("Show All Orders"),
      checked: showAllOrders,
      onChange: setShowAllOrders,
    },
    {
      label: t("Show Served Orders"),
      checked: showServedOrders,
      onChange: setShowServedOrders,
    },
    {
      label: t("Show All Gameplays"),
      checked: showAllGameplays,
      onChange: setShowAllGameplays,
    },
    {
      label: t("Show Closed Tables"),
      checked: showAllTables,
      onChange: setShowAllTables,
    },
  ];
  return (
    <>
      <Header />
      <div className="container relative h-full py-4 px-2 lg:px-12 ">
        <div className="h-full flex w-full flex-wrap flex-col">
          <div className="flex lg:justify-between justify-center flex-col lg:flex-row">
            <div className="flex flex-row items-center w-full text-3xl">
              <IoIosArrowBack
                className="text-xl"
                onClick={() => {
                  handleDecrementDate(selectedDate ?? "");
                }}
              />
              <DateInput
                date={parseDate(selectedDate)}
                setDate={setSelectedDate}
              />
              <IoIosArrowForward
                className="text-xl"
                onClick={() => {
                  handleIncrementDate(selectedDate ?? "");
                }}
              />
            </div>
            {/* Table name buttons for small screen */}
            <div className="flex flex-wrap gap-2 mt-4 sm:hidden">
              {tables
                ?.filter((table) => !table?.finishHour)
                ?.map((table) => (
                  <a
                    key={table?._id + "tableselector"}
                    onClick={() => scrollToSection(`table-${table?._id}`)}
                    className={` bg-gray-100 px-4 py-2 rounded-lg focus:outline-none  hover:bg-gray-200 text-gray-600 hover:text-black font-medium ${bgColor(
                      table
                    )}`}
                  >
                    {table?.name}
                  </a>
                ))}
            </div>
            {/* buttons */}
            <div className="flex flex-col md:flex-row justify-between gap-2 md:gap-4 mt-2 md:mt-0 md:mr-40">
              {buttons.map((button, index) => (
                <button
                  key={index}
                  onClick={button.onClick}
                  className={`min-w-fit transition duration-150 ease-in-out hover:bg-blue-900 hover:text-white active:bg-blue-700 active:text-white rounded-lg border border-gray-800 text-gray-800 px-4 py-2 text-sm md:block ${
                    button.hideOnMobile ? "hidden" : ""
                  }`}
                >
                  {button.label}
                </button>
              ))}
            </div>
          </div>
          {/* Table name buttons for big screen */}
          <div className=" flex-wrap gap-2 my-4 hidden sm:flex">
            {tables
              ?.filter((table) => !table?.finishHour)
              ?.map((table) => (
                <a
                  key={table?._id + "tableselector"}
                  onClick={() => scrollToSection(`table-large-${table?._id}`)}
                  className={` bg-gray-100 px-4 py-2 rounded-lg focus:outline-none  hover:bg-gray-200 text-gray-600 hover:text-black font-medium cursor-pointer ${bgColor(
                    table
                  )}`}
                >
                  {table?.name}
                </a>
              ))}
          </div>
          <div className="flex flex-col  md:flex-row  items-center  mt-4 md:mt-2">
            {/*Cafe info opentables ...  */}
            {(activeTableCount > 0 ||
              totalTableCount > 0 ||
              activeCustomerCount > 0 ||
              totalCustomerCount > 0) && (
              <div className="relative w-80 h-28 border border-gray-400 rounded-md ">
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2   ">
                  <InfoBox
                    title={t("Active Table")}
                    count={activeTableCount}
                    className="rounded-tl-2xl"
                  />
                  <InfoBox
                    title={t("Total Table")}
                    count={totalTableCount}
                    className=" rounded-tr-2xl"
                  />
                  <InfoBox
                    title={t("Active Customer")}
                    count={activeCustomerCount}
                    className=" rounded-bl-2xl "
                  />
                  <InfoBox
                    title={t("Total Customer")}
                    count={totalCustomerCount}
                    className="rounded-br-2xl"
                  />
                </div>
                <div className="absolute inset-0 flex justify-center items-center">
                  <div className="w-full h-[1px] bg-gray-400" />
                </div>
                <div className="absolute inset-0 flex justify-center items-center">
                  <div className="h-full w-[1px] bg-gray-400" />
                </div>
              </div>
            )}
            <div className="flex flex-col md:ml-8 justify-between w-full px-2 md:px-0 mt-2 md:mt-0">
              {/* who is/was at the cafe */}
              {selectedDate && isToday(selectedDate) ? (
                <ActiveVisitList
                  suggestions={users}
                  name="employees"
                  label={t("Who's at cafe?")}
                  visits={visits}
                />
              ) : (
                <PreviousVisitList visits={filteredVisits} />
              )}

              {/* filters */}
              <div className="grid grid-cols-2 md:flex md:flex-row md:gap-4 justify-end mt-4">
                {switchFilters.map((filter, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <H5>{filter.label}</H5>
                    <SwitchButton
                      checked={filter.checked}
                      onChange={filter.onChange as any}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="h-full hidden lg:grid grid-cols-4 mt-6 gap-x-8 ">
          {tableColumns.map((tablesColumns, idx) => (
            <div key={idx}>
              {tablesColumns.map((table) => (
                <div
                  id={`table-large-${table?._id}`}
                  key={table?._id || table?.startHour}
                >
                  <TableCard
                    key={table?._id || table?.startHour}
                    table={table}
                    mentors={mentors}
                    games={games}
                    showAllGameplays={showAllGameplays}
                    showAllOrders={showAllOrders}
                    showServedOrders={showServedOrders}
                    tables={tables}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="h-full grid lg:hidden grid-cols-1 mt-4 gap-x-8">
          {tables.map((table) => (
            <div
              id={`table-${table?._id}`}
              key={table?._id || table?.startHour}
            >
              <TableCard
                table={table}
                mentors={mentors}
                games={games as Game[]}
                showAllGameplays={showAllGameplays}
                showAllOrders={showAllOrders}
                showServedOrders={showServedOrders}
                tables={tables}
              />
            </div>
          ))}
        </div>
      </div>
      {isCreateTableDialogOpen && (
        <CreateTableDialog
          isOpen={isCreateTableDialogOpen}
          close={() => setIsCreateTableDialogOpen(false)}
          type={TableTypes.NORMAL}
        />
      )}
      {isConsumptModalOpen && (
        <GenericAddEditPanel
          close={() => setIsConsumptModalOpen(false)}
          inputs={consumptInputs}
          constantValues={{
            location: selectedLocationId
              ? getStockLocation(selectedLocationId)
              : "",
          }}
          isOpen={isConsumptModalOpen}
          formKeys={consumptFormKeys}
          submitItem={consumptStock as any}
          buttonName={t("Submit")}
          topClassName="flex flex-col gap-2 "
        />
      )}
      {isLossProductModalOpen && (
        <GenericAddEditPanel
          isOpen={isLossProductModalOpen}
          close={() => setIsLossProductModalOpen(false)}
          inputs={orderInputs}
          formKeys={orderFormKeys}
          submitItem={createOrder as any}
          isBlurFieldClickCloseEnabled={false}
          setForm={setOrderForm}
          isCreateCloseActive={false}
          constantValues={{
            quantity: 1,
            stockLocation: getStockLocation(selectedLocationId),
          }}
          cancelButtonLabel="Close"
          submitFunction={() => {
            const selectedMenuItem = getItem(orderForm?.item, menuItems);
            const selectedMenuItemCategory = getItem(
              selectedMenuItem?.category,
              categories
            );
            if (selectedMenuItem && user) {
              createOrder({
                ...orderForm,
                location: selectedLocationId,
                unitPrice: selectedMenuItem.price,
                paidQuantity: 0,
                status: OrderStatus.WASTED,
                kitchen: selectedMenuItemCategory?.kitchen,
                stockLocation: getStockLocation(selectedLocationId),
                stockNote: StockHistoryStatusEnum.LOSSPRODUCT,
              });
            }
            setOrderForm(initialOrderForm);
          }}
          generalClassName=" md:rounded-l-none shadow-none mt-[-4rem] md:mt-0"
          topClassName="flex flex-col gap-2   "
        />
      )}
      {isTakeAwayOrderModalOpen && (
        <GenericAddEditPanel
          isOpen={isTakeAwayOrderModalOpen}
          close={() => {
            setOrderCreateBulk([]); //this can be removed if we do not want to loose the bulk order data at close
            setIsTakeAwayOrderModalOpen(false);
          }}
          inputs={orderInputsForTakeAway}
          formKeys={orderFormKeysForTakeAway}
          submitItem={createTable as any}
          isBlurFieldClickCloseEnabled={false}
          setForm={setOrderForm}
          isCreateCloseActive={false}
          optionalCreateButtonActive={orderCreateBulk?.length > 0}
          constantValues={{
            quantity: 1,
            stockLocation: selectedLocationId === 1 ? "bahceli" : "neorama",
          }}
          buttonName={t("Payment")}
          cancelButtonLabel="Close"
          anotherPanelTopClassName="h-full sm:h-auto flex flex-col gap-2 sm:gap-0  sm:grid grid-cols-1 md:grid-cols-2  w-5/6 md:w-1/2 overflow-scroll no-scrollbar sm:overflow-visible  "
          anotherPanel={<OrderTakeawayPanel />}
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
            const currentDate = new Date();
            const hours = currentDate.getHours().toString().padStart(2, "0");
            const minutes = currentDate
              .getMinutes()
              .toString()
              .padStart(2, "0");
            const formattedTime = `${hours}:${minutes}`;
            const orderObject = handleOrderObject();
            const tableData = {
              name: "Takeaway",
              date: selectedDate,
              location: selectedLocationId,
              playerCount: 2,
              startHour: formattedTime,
              gameplays: [],
              type: TableTypes.TAKEOUT,
            };
            const ordersData = orderObject
              ? [...orderCreateBulk, orderObject]
              : orderCreateBulk;
            createTable({
              tableDto: tableData,
              orders: ordersData,
            } as any);
            setIsTakeAwayOrderModalOpen(false);
          }}
          generalClassName=" md:rounded-l-none shadow-none mt-[-4rem] md:mt-0"
          topClassName="flex flex-col gap-2   "
        />
      )}
      {isTakeAwayPaymentModalOpen && takeawayTableId !== 0 && (
        <OrderPaymentModal
          tableId={takeawayTableId}
          tables={tables}
          close={() => {
            setIsTakeAwayPaymentModalOpen(false);
            setTakeawayTableId(0);
          }}
        />
      )}
    </>
  );
};

export default Tables;
