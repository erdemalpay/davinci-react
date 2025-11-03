import { Tooltip } from "@material-tailwind/react";
import { format, subDays } from "date-fns";
import { isEqual } from "lodash";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { ActiveButtonCallsList } from "../components/buttonCalls/ActiveButtonCallsList";
import { DateInput } from "../components/common/DateInput2";
import { GenericButton } from "../components/common/GenericButton";
import { Header } from "../components/header/Header";
import OrderPaymentModal from "../components/orders/orderPayment/OrderPaymentModal";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import { H5 } from "../components/panelComponents/Typography";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import { ActiveVisitList } from "../components/tables/ActiveVisitList";
import OrderTakeawayPanel from "../components/tables/OrderTakeawayPanel";
import { PreviousVisitList } from "../components/tables/PreviousVisitList";
import ShiftList from "../components/tables/ShiftList";
import { TableCard } from "../components/tables/TableCard";
import { useDateContext } from "../context/Date.context";
import { useGeneralContext } from "../context/General.context";
import { useLocationContext } from "../context/Location.context";
import { useOrderContext } from "../context/Order.context";
import { Routes } from "../navigation/constants";
import {
  Game,
  MenuItem,
  Order,
  OrderDiscountStatus,
  OrderStatus,
  ReservationStatusEnum,
  StockHistoryStatusEnum,
  TURKISHLIRA,
  Table,
  TableStatus,
  TableTypes,
  User,
} from "../types";
import { useGetAllAccountProducts } from "../utils/api/account/product";
import {
  useConsumptStockMutation,
  useGetAccountStocks,
} from "../utils/api/account/stock";
import { useGetGames } from "../utils/api/game";
import {
  useGetAllLocations,
  useGetStockLocations,
  useGetStoreLocations,
} from "../utils/api/location";
import { useGetMemberships } from "../utils/api/membership";
import { useGetCategories } from "../utils/api/menu/category";
import { useGetKitchens } from "../utils/api/menu/kitchen";
import { useGetMenuItems } from "../utils/api/menu/menu-item";
import { useGetTodayOrders, useOrderMutations } from "../utils/api/order/order";
import { useGetOrderDiscounts } from "../utils/api/order/orderDiscount";
import { useGetOrderNotes } from "../utils/api/order/orderNotes";
import { useGetReservations } from "../utils/api/reservations";
import { useGetTables, useTableMutations } from "../utils/api/table";
import { useGetUser, useGetUsers } from "../utils/api/user";
import { useGetVisits } from "../utils/api/visit";
import { formatDate, isToday, parseDate } from "../utils/dateUtil";
import { getItem } from "../utils/getItem";
import { LocationInput } from "../utils/panelInputs";
import { sortTable } from "../utils/sort";

const Tables = () => {
  const { t } = useTranslation();
  const [isCreateTableDialogOpen, setIsCreateTableDialogOpen] = useState(false);
  const { setSelectedDate, selectedDate } = useDateContext();
  const stocks = useGetAccountStocks();
  const [showAllTables, setShowAllTables] = useState(true);
  const orderNotes = useGetOrderNotes();
  const [showAllGameplays, setShowAllGameplays] = useState(true);
  const [tableOrderPaymentTableId, setTableOrderPaymentTableId] = useState<
    number | null
  >(null);

  const members = useGetMemberships();
  const user = useGetUser();
  const reservations = useGetReservations();
  const [isTableOrderPaymentModalOpen, setIsTableOrderPaymentModalOpen] =
    useState(false);
  const { resetOrderContext } = useOrderContext();
  const { setExpandedRows } = useGeneralContext();
  const [isTakeAwayPaymentModalOpen, setIsTakeAwayPaymentModalOpen] =
    useState(false);
  const [isTakeAwayOrderModalOpen, setIsTakeAwayOrderModalOpen] =
    useState(false);

  const [isConsumptModalOpen, setIsConsumptModalOpen] = useState(false);
  const [isLossProductModalOpen, setIsLossProductModalOpen] = useState(false);
  const [showAllOrders, setShowAllOrders] = useState(true);
  const [showServedOrders, setShowServedOrders] = useState(true);
  const todayOrders = useGetTodayOrders();
  const { selectedLocationId } = useLocationContext();
  const { setIsTabInputScreenOpen } = useGeneralContext();
  const { mutate: consumptStock } = useConsumptStockMutation();
  const { createTable } = useTableMutations();
  const locations = useGetStoreLocations();
  const allLocations = useGetAllLocations();
  const navigate = useNavigate();
  const games = useGetGames();
  const visits = useGetVisits();
  const stockLocations = useGetStockLocations();
  const products = useGetAllAccountProducts();
  const kitchens = useGetKitchens();
  const categories = useGetCategories();
  const { createOrder } = useOrderMutations();

  // Get normalized table names that have "Coming" status reservations
  const comingReservedTableNames = useMemo(() => {
    if (!reservations || !selectedLocationId) return new Set<string>();

    return new Set(
      reservations
        .filter(
          (reservation) =>
            reservation.status === ReservationStatusEnum.COMING &&
            reservation.location === selectedLocationId &&
            reservation.reservedTable
        )
        .map((reservation) => reservation.reservedTable.trim().toLowerCase())
    );
  }, [reservations, selectedLocationId]);

  const inactiveCategories = useMemo(() => {
    return categories?.filter((category) => !category.active) || [];
  }, [categories]);
  const inactiveCategoriesWithKitchens = useMemo(() => {
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
  const {
    orderCreateBulk,
    setOrderCreateBulk,

    takeawayTableId,
    setTakeawayTableId,
    setSelectedNewOrders,
    selectedNewOrders,
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
    stockLocation: selectedLocationId,
  };
  const [tableForm, setTableForm] = useState({
    name: "",
    startHour: format(new Date(), "HH:mm"),
    playerCount: 2,
    location: selectedLocationId,
    type: TableTypes.NORMAL,
    isAutoEntryAdded: false,
    isOnlineSale: false,
    tables: [],
  });
  const discounts = useGetOrderDiscounts()?.filter(
    (discount) => discount?.status !== OrderDiscountStatus.DELETED
  );
  const tableTypeOptions = Object.values(TableTypes)
    .filter((value) => [TableTypes.ACTIVITY, TableTypes.NORMAL].includes(value))
    .map((value) => ({
      value,
      label: t(value.charAt(0).toUpperCase() + value.slice(1)),
    }));
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
  const [orderForm, setOrderForm] = useState(initialOrderForm);
  const consumptInputs = [
    {
      type: InputTypes.TAB,
      formKey: "product",
      label: t("Product"),
      options: products?.map((product) => {
        const matchedItem = menuItems?.find(
          (item) => item.matchedProduct === product._id
        );
        return {
          value: product._id,
          label: product.name,
          keywords: [matchedItem?.sku ?? "", matchedItem?.barcode ?? ""],
        };
      }),
      placeholder: t("Product"),
      required: true,
      isTopFlexRow: true,
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
    LocationInput({ locations: allLocations, isTopFlexRow: true }),
  ];
  const consumptFormKeys = [
    { key: "product", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
    { key: "location", type: FormKeyTypeEnum.STRING },
  ];
  const menuItemOptions = useMemo(() => {
    return menuItems
      ?.filter((menuItem) => {
        return (
          !orderForm.category ||
          menuItem.category === Number(orderForm.category)
        );
      })
      ?.filter((item) => {
        return !inactiveCategoriesIds.includes(item.category);
      })
      ?.filter((menuItem) => menuItem?.locations?.includes(selectedLocationId))
      ?.map((menuItem) => {
        return {
          value: menuItem?._id,
          label:
            menuItem?.name +
            " (" +
            (orderForm.isOnlinePrice && menuItem?.onlinePrice
              ? menuItem.onlinePrice
              : menuItem.price) +
            TURKISHLIRA +
            ")",
          imageUrl: menuItem?.imageUrl,
          keywords: [
            menuItem?.name,
            ...(menuItem?.sku ? [menuItem.sku] : []),
            ...(menuItem?.barcode ? [menuItem.barcode] : []),
            getItem(menuItem?.category, categories)?.name || "",
          ],
          triggerExtraModal: menuItem?.suggestedDiscount ? true : false,
        };
      });
  }, [
    menuItems,
    orderForm.category,
    orderForm.isOnlinePrice,
    inactiveCategoriesIds,
    selectedLocationId,
    categories,
  ]);
  const makePressHandlers = (tableId: number, targetId: string) => {
    let timer: number | null = null;
    let longFired = false;
    const LONG_MS = 600;

    const clear = () => {
      if (timer) window.clearTimeout(timer);
      timer = null;
    };

    const start = () => {
      longFired = false;
      clear();
      timer = window.setTimeout(() => {
        longFired = true;
        setTableOrderPaymentTableId(tableId);
        setIsTableOrderPaymentModalOpen(true);
      }, LONG_MS);
    };

    const end = () => {
      clear();
      if (!longFired) {
        scrollToSection(targetId);
      }
    };

    return {
      onMouseDown: start,
      onMouseUp: end,
      onMouseLeave: clear,
      onTouchStart: start,
      onTouchEnd: end,
      onTouchCancel: clear,
    };
  };

  const orderInputs = [
    {
      type: InputTypes.TAB,
      formKey: "category",
      label: t("Category"),
      options: categories
        ?.filter((category) => {
          return (
            category.active && category?.locations?.includes(selectedLocationId)
          );
        })
        ?.sort((a, b) => a.orderCategoryOrder - b.orderCategoryOrder)
        ?.map((category) => {
          return {
            value: category._id,
            label: category.name,
            imageUrl: category?.imageUrl,
          };
        }),
      isSortDisabled: true,
      invalidateKeys: [
        { key: "item", defaultValue: 0 },
        { key: "discount", defaultValue: undefined },
        { key: "discountNote", defaultValue: "" },
        { key: "isOnlinePrice", defaultValue: false },
        { key: "stockLocation", defaultValue: selectedLocationId },
      ],
      placeholder: t("Category"),
      required: false,
      isDisabled: !user?.settings?.orderCategoryOn,
      triggerTabOpenOnChangeFor: "item",
      handleTriggerTabOptions: (value: any) => {
        return menuItems
          ?.filter((menuItem) => {
            return menuItem.category === value;
          })
          ?.filter((item) => {
            return !inactiveCategoriesIds.includes(item.category);
          })
          ?.filter((menuItem) =>
            menuItem?.locations?.includes(selectedLocationId)
          )
          ?.map((menuItem) => {
            return {
              value: menuItem?._id,
              label: menuItem?.name + " (" + menuItem.price + TURKISHLIRA + ")",
              imageUrl: menuItem?.imageUrl,
            };
          });
      },
      isTopFlexRow: true,
    },
    {
      type: InputTypes.TAB,
      formKey: "item",
      label: t("Product"),
      options: menuItemOptions?.map((option) => {
        return {
          value: option.value,
          label: option.label,
          imageUrl: option?.imageUrl,
          keywords: option?.keywords,
        };
      }),
      invalidateKeys: [
        { key: "discount", defaultValue: undefined },
        { key: "discountNote", defaultValue: "" },
        { key: "isOnlinePrice", defaultValue: false },
      ],
      placeholder: t("Product"),
      required: true,
      isTopFlexRow: true,
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
      formKey: "stockLocation",
      label: t("Stock Location"),
      options: stockLocations?.map((input) => {
        const menuItem = getItem(orderForm?.item, menuItems);
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
      required:
        (getItem(orderForm?.item, menuItems)?.itemProduction?.length ?? 0) > 0,
      isDisabled: !(
        getItem(orderForm?.item, menuItems)?.itemProduction?.length ?? 0 > 0
      ),
    },
    {
      type: InputTypes.TEXTAREA,
      formKey: "note",
      label: t("Note"),
      placeholder: t("Note"),
      required: true,
      options:
        orderNotes
          ?.filter((note) => {
            const foundItem = getItem(orderForm.item, menuItems);
            return (
              note?.categories?.includes(Number(orderForm?.category)) ||
              note?.items?.includes(Number(orderForm?.item)) ||
              (foundItem &&
                note?.categories?.includes(Number(foundItem?.category)))
            );
          })
          ?.map((note) => ({
            value: note.note,
            label: note.note,
          })) ?? [],
    },
  ];
  const orderFormKeys = [
    { key: "category", type: FormKeyTypeEnum.STRING },
    { key: "item", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
    { key: "stockLocation", type: FormKeyTypeEnum.NUMBER },
    { key: "note", type: FormKeyTypeEnum.STRING },
  ];
  const isOnlinePrice = () => {
    const menuItem = menuItems?.find((item) => item._id === orderForm.item);
    if (getItem(menuItem?.category, categories)?.isOnlineOrder) {
      return true;
    }
    return false;
  };
  const MEMBERDISCOUNTID = 8;
  const memberDiscount = useMemo(() => {
    return discounts?.find((discount) => discount._id === MEMBERDISCOUNTID);
  }, [discounts]);
  const orderInputsForTakeAway = [
    {
      type: InputTypes.TAB,
      formKey: "category",
      label: t("Category"),
      options: categories
        ?.filter((category) => {
          return (
            category.active && category?.locations?.includes(selectedLocationId)
          );
        })
        ?.sort((a, b) => a.orderCategoryOrder - b.orderCategoryOrder)
        ?.map((category) => {
          return {
            value: category._id,
            label: category.name,
            imageUrl: category?.imageUrl,
          };
        }),
      isSortDisabled: true,
      invalidateKeys: [
        { key: "item", defaultValue: 0 },
        { key: "discount", defaultValue: undefined },
        { key: "discountNote", defaultValue: "" },
        { key: "isOnlinePrice", defaultValue: false },
        { key: "stockLocation", defaultValue: selectedLocationId },
      ],
      placeholder: t("Category"),
      required: false,
      isDisabled: !user?.settings?.orderCategoryOn,
      triggerTabOpenOnChangeFor: "item",
      handleTriggerTabOptions: (value: any) => {
        return menuItems
          ?.filter((menuItem) => {
            return menuItem.category === value;
          })
          ?.filter((item) => {
            return !inactiveCategoriesIds.includes(item.category);
          })
          ?.filter((menuItem) =>
            menuItem?.locations?.includes(selectedLocationId)
          )
          ?.map((menuItem) => {
            return {
              value: menuItem?._id,
              label:
                menuItem?.name +
                " (" +
                (orderForm.isOnlinePrice && menuItem?.onlinePrice
                  ? menuItem.onlinePrice
                  : menuItem.price) +
                TURKISHLIRA +
                ")",
              imageUrl: menuItem?.imageUrl,
            };
          });
      },
      isTopFlexRow: true,
    },
    {
      type: InputTypes.TAB,
      formKey: "item",
      label: t("Product"),
      options: menuItemOptions,
      invalidateKeys: [
        { key: "discount", defaultValue: undefined },
        { key: "discountNote", defaultValue: "" },
        { key: "isOnlinePrice", defaultValue: false },
        { key: "stockLocation", defaultValue: selectedLocationId },
      ],
      // isExtraModalOpen: isExtraModalOpen,
      // setIsExtraModalOpen: setIsExtraModalOpen as any,
      // extraModal: (
      //   <SuggestedDiscountModal
      //     isOpen={isExtraModalOpen}
      //     items={menuItems}
      //     itemId={orderForm.item as number}
      //     closeModal={() => {
      //       setIsExtraModalOpen(false);
      //       setIsTabInputScreenOpen(false);
      //       setTabInputScreenOptions([]);
      //     }}
      //     orderForm={orderForm}
      //     setOrderForm={setOrderForm}
      //   />
      // ),
      placeholder: t("Product"),
      required: true,
      isTopFlexRow: true,
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
      type: InputTypes.TAB,
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
      suggestedOption: orderForm?.item
        ? getItem(orderForm.item, menuItems)?.suggestedDiscount?.length
          ? getItem(orderForm.item, menuItems)?.suggestedDiscount?.map(
              (discountId: number) => ({
                value: discountId as any,
                label:
                  discounts?.find((discount) => discount._id === discountId)
                    ?.name || "",
              })
            )
          : []
        : [],
      invalidateKeys: [{ key: "discountNote", defaultValue: "" }],
      placeholder: t("Discount"),
      isAutoFill: false,
      required: false,
      isTopFlexRow: true,
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
          orderForm?.discount !== MEMBERDISCOUNTID &&
          discounts?.find((discount) => discount._id === orderForm.discount)
            ?.isNoteRequired) ??
        false,
      isDisabled:
        (orderForm?.discount === MEMBERDISCOUNTID ||
          (orderForm?.discount &&
            !discounts?.find((discount) => discount._id === orderForm.discount)
              ?.isNoteRequired)) ??
        true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "discountNote",
      label: t("Discount Note"),
      placeholder: memberDiscount?.note,
      options: members
        ?.filter((membership) => membership.endDate >= formatDate(new Date()))
        ?.map((membership) => ({
          value: membership.name,
          label: membership.name,
        })),
      isMultiple: true,
      required: orderForm?.discount === MEMBERDISCOUNTID,
      isDisabled: orderForm?.discount !== MEMBERDISCOUNTID,
      isOnClearActive: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "stockLocation",
      label: t("Stock Location"),
      options: stockLocations?.map((input) => {
        const menuItem = getItem(orderForm.item, menuItems);
        const foundProduct = getItem(menuItem?.matchedProduct, products);
        const stockQuantity = menuItem
          ? menuItemStockQuantity(menuItem, input._id)
          : null;
        const shelfInfo = foundProduct?.shelfInfo?.find(
          (shelf) => shelf.location === input._id
        );
        return {
          value: input._id,
          label:
            input.name +
            (menuItem?.itemProduction && menuItem.itemProduction.length > 0
              ? ` (${t("Stock")}: ${stockQuantity})`
              : "") +
            (shelfInfo?.shelf ? ` (${t("Shelf")}: ${shelfInfo?.shelf})` : ""),
        };
      }),
      placeholder: t("Stock Location"),
      required:
        (getItem(orderForm.item, menuItems)?.itemProduction?.length ?? 0) > 0,
      isDisabled: !(
        getItem(orderForm.item, menuItems)?.itemProduction?.length ?? 0 > 0
      ),
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
      options:
        orderNotes
          ?.filter((note) => {
            const foundItem = getItem(orderForm.item, menuItems);
            return (
              note?.categories?.includes(Number(orderForm?.category)) ||
              note?.items?.includes(Number(orderForm?.item)) ||
              (foundItem &&
                note?.categories?.includes(Number(foundItem?.category)))
            );
          })
          ?.map((note) => ({
            value: note.note,
            label: note.note,
          })) ?? [],
    },
  ];
  const orderFormKeysForTakeAway = [
    { key: "category", type: FormKeyTypeEnum.STRING },
    { key: "item", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
    { key: "discount", type: FormKeyTypeEnum.NUMBER },
    { key: "discountNote", type: FormKeyTypeEnum.STRING },
    { key: "stockLocation", type: FormKeyTypeEnum.NUMBER },
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
  const activeTables = tables?.filter((table) => !table?.finishHour);
  const activeTableCount =
    (tables?.filter(
      (table) => !table?.finishHour && table.type === TableTypes.NORMAL
    ).length || 0) +
    (tables
      ?.filter(
        (table) => !table?.finishHour && table.type === TableTypes.ACTIVITY
      )
      .reduce((prev, curr) => {
        return Number(prev) + Number(curr.tables?.length || 0);
      }, 0) || 0);
  const waitingReservations = reservations?.filter(
    (reservation) => reservation.status === ReservationStatusEnum.WAITING
  )?.length;
  const comingReservations = reservations?.filter(
    (reservation) => reservation.status === ReservationStatusEnum.COMING
  )?.length;
  const emptyTableCount =
    (getItem(selectedLocationId, locations)?.tableCount ?? 0) -
    activeTableCount;
  const totalTableCount =
    getItem(selectedLocationId, locations)?.tableCount ?? 0;

  const activeCustomerCount =
    activeTables?.reduce((prev: number, curr: Table) => {
      return Number(prev) + Number(curr.playerCount || 0);
    }, 0) || 0;
  const totalCustomerCount =
    tables?.reduce((prev: number, curr: Table) => {
      return Number(prev) + Number(curr.playerCount || 0);
    }, 0) || 0;
  const tableColumns: Table[][] = [[], [], [], []];
  (showAllTables ? tables : activeTables)?.forEach((table, index) => {
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
        createdAt: new Date(),
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
        stockLocation: orderForm?.stockLocation ?? selectedLocationId,
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
        stockLocation: orderForm?.stockLocation ?? selectedLocationId,
      };
    }
    return null;
  };
  const scrollToSection = (id: string, offset = 100) => {
    const element = document.getElementById(id);
    if (!element) return;

    const elementPosition =
      element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  };

  const cafeInfos: {
    title: string;
    value: any;
    tooltip?: string;
  }[] = [
    {
      title: "Total Table",
      value: totalTableCount,
    },
    {
      title: "Total Customer",
      value: totalCustomerCount,
    },
    {
      title: "Empty Table",
      value: emptyTableCount,
    },

    {
      title: "Active Table",
      value: activeTableCount,
    },
    {
      title: "Active Customer",
      value: activeCustomerCount,
    },
    {
      title: "Reservations",
      value: `${waitingReservations} / ${comingReservations}`,
      tooltip: t("Waiting / Coming"),
    },
  ];

  const bgColor = (table: Table) => {
    const tableOrders = todayOrders?.filter(
      (order) => (order.table as Table)?._id === table?._id
    );
    return tableOrders?.some(
      (tableOrder) => (tableOrder as Order)?.status === OrderStatus.READYTOSERVE
    )
      ? "bg-orange-200"
      : "bg-red-300";
  };

  // Purple styling for reserved tables with "Coming" status
  const reservedTableClass = "bg-purple-400 text-white hover:bg-purple-500";

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
      hideOnMobile: false,
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
        setTableForm({
          ...tableForm,
          name: "",
        });
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
  const tableInputs = [
    tableForm.type !== TableTypes.ACTIVITY
      ? {
          type: InputTypes.SELECT,
          formKey: "name",
          label: t("Name"),
          options: locations
            .find((location) => location._id === selectedLocationId)
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
          isSortDisabled: true,
          placeholder: t("Name"),
          required: true,
        }
      : {
          type: InputTypes.TEXT,
          formKey: "name",
          label: t("Name"),
          required: true,
        },
    {
      type: InputTypes.HOUR,
      formKey: "startHour",
      label: t("Start Time"),
      required: true,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "playerCount",
      label: t("Player Count"),
      placeholder: t("Player Count"),
      required: false,
      minNumber: 0,
      isNumberButtonsActive: true,
      isOnClearActive: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "type",
      label: t("Type"),
      options: tableTypeOptions,
      placeholder: t("Type"),
      invalidateKeys: [
        { key: "name", defaultValue: "" },
        { key: "tables", defaultValue: "" },
      ],
      isDisabled: false,
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "tables",
      label: t("Tables"),
      options: locations
        .find((location) => location._id === selectedLocationId)
        ?.tableNames?.filter((t) => {
          return !tables.find(
            (table) =>
              (table.name === t ||
                table?.tables?.includes(t) ||
                tableForm.name === t) &&
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
      placeholder: t("Tables"),
      isSortDisabled: true,
      isMultiple: true,
      isDisabled: tableForm.type !== TableTypes.ACTIVITY,
      required: tableForm.type === TableTypes.ACTIVITY,
    },
  ];
  const tableFormKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "type", type: FormKeyTypeEnum.STRING },
    { key: "startHour", type: FormKeyTypeEnum.STRING },
    { key: "isAutoEntryAdded", type: FormKeyTypeEnum.BOOLEAN },
    { key: "isOnlineSale", type: FormKeyTypeEnum.BOOLEAN },
    { key: "playerCount", type: FormKeyTypeEnum.NUMBER },
    { key: "location", type: FormKeyTypeEnum.NUMBER },
    { key: "type", type: FormKeyTypeEnum.STRING },
    { key: "tables", type: FormKeyTypeEnum.STRING },
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
            <div
              key={activeTableCount + "small"}
              className="flex flex-col  flex-wrap gap-2 mt-4 sm:hidden"
            >
              <div className="mb-5 sm:mb-0 flex-row w-full text-lg">
                <ActiveButtonCallsList />
              </div>
              <div className="flex flex-row gap-2">
                {/* inactive tables */}
                <div
                  key={selectedLocationId + "tables-small"}
                  className="flex gap-2 flex-wrap"
                >
                  {locations
                    ?.find((location) => location._id === selectedLocationId)
                    ?.tableNames?.map((tableName, index) => {
                      const table = tables?.find(
                        (table) =>
                          table.name === tableName ||
                          table?.tables?.includes(tableName)
                      );
                      if (table && !table?.finishHour) {
                        return (
                          <a
                            key={`${table._id}-${tableName}-tableselector-small`}
                            className={` bg-gray-100 px-4 py-2 rounded-lg focus:outline-none  hover:bg-red-500 text-white  font-medium ${bgColor(
                              table
                            )}`}
                            {...makePressHandlers(
                              table._id,
                              `table-${table._id}`
                            )}
                          >
                            {table?.type === TableTypes.ACTIVITY
                              ? `${tableName} (${table?.name})`
                              : table?.name}
                          </a>
                        );
                      }
                      const isReservedComing = comingReservedTableNames.has(
                        tableName.trim().toLowerCase()
                      );
                      return (
                        <a
                          key={tableName + "-tableselector-small"}
                          onClick={() => {
                            setTableForm({
                              ...tableForm,
                              name: tableName,
                            });
                            setIsCreateTableDialogOpen(true);
                          }}
                          className={`px-4 py-2 rounded-lg focus:outline-none font-medium cursor-pointer ${
                            isReservedComing
                              ? reservedTableClass
                              : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-black"
                          }`}
                        >
                          {tableName}
                        </a>
                      );
                    })}
                </div>
              </div>
            </div>
            {/* buttons */}
            <div className="flex flex-col md:flex-row justify-between gap-2 md:gap-4 mt-2 md:mt-0 md:mr-40">
              {buttons.map((button, index) => (
                <GenericButton
                  key={index}
                  onClick={button.onClick}
                  variant="ghost"
                  className={`min-w-fit transition duration-150 ease-in-out hover:translate-y-0.5 active:translate-y-1 rounded-lg border border-gray-800 text-gray-800 hover:text-gray-800 px-4 py-2 text-sm ${
                    button.hideOnMobile ? "hidden md:block" : ""
                  }`}
                >
                  {button.label}
                </GenericButton>
              ))}
            </div>
          </div>
          {/* Table name buttons for big screen */}
          <div
            key={activeTableCount + "big"}
            className="sm:flex-col gap-2 hidden sm:flex"
          >
            <div className="flex-wrap gap-2 my-4">
              {/* active buttons */}
              <div className="mb-5 sm:mb-0 flex-row w-full text-lg">
                <ActiveButtonCallsList />
              </div>
            </div>

            <div className="flex flex-row gap-2">
              {/* inactive tables */}
              <div className="flex gap-2 flex-wrap">
                {locations
                  ?.find((location) => location._id === selectedLocationId)
                  ?.tableNames?.map((tableName) => {
                    const table = tables?.find(
                      (t) =>
                        t.name === tableName || t.tables?.includes(tableName)
                    );

                    if (table && !table.finishHour) {
                      return (
                        <a
                          key={`${table._id}-${tableName}-tableselector-large`}
                          className={`bg-gray-100 px-4 py-2 rounded-lg cursor-pointer focus:outline-none hover:bg-red-500 text-white font-medium ${bgColor(
                            table
                          )}`}
                          {...makePressHandlers(
                            table._id,
                            `table-large-${table._id}`
                          )}
                        >
                          {table.type === TableTypes.ACTIVITY
                            ? `${tableName} (${table.name})`
                            : table.name}
                        </a>
                      );
                    }

                    const isReservedComing = comingReservedTableNames.has(
                      tableName.trim().toLowerCase()
                    );
                    return (
                      <a
                        key={tableName}
                        onClick={() => {
                          setTableForm({ ...tableForm, name: tableName });
                          setIsCreateTableDialogOpen(true);
                        }}
                        className={`px-4 py-2 rounded-lg focus:outline-none font-medium cursor-pointer ${
                          isReservedComing
                            ? reservedTableClass
                            : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-black"
                        }`}
                      >
                        {tableName}
                      </a>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="flex flex-col  md:flex-row  items-center  mt-4 md:mt-2">
            {/*Cafe info opentables ...  */}
            {(activeTableCount > 0 ||
              totalTableCount > 0 ||
              activeCustomerCount > 0 ||
              totalCustomerCount > 0) && (
              <div className="border  w-fit min-w-fit border-gray-400 rounded-md ">
                <div className=" grid grid-cols-3  grid-rows-2 divide-x divide-y    divide-gray-200  ">
                  {cafeInfos.map((info, index) =>
                    info?.tooltip ? (
                      <Tooltip
                        key={index + "cafeinfo"}
                        content={info.tooltip}
                        placement="top"
                        className="!z-[999999999999999999999]"
                      >
                        <div className="flex flex-col items-center justify-center p-2 min-w-fit">
                          <h4 className="text-center text-[14px]">
                            {t(info.title)}
                          </h4>
                          <p className="font-thin">{info.value}</p>
                        </div>
                      </Tooltip>
                    ) : (
                      <div
                        key={index + "cafeinfo"}
                        className="flex flex-col items-center justify-center p-2 min-w-fit"
                      >
                        <h4 className="text-center text-[14px]">
                          {t(info.title)}
                        </h4>
                        <p className="font-thin">{info.value}</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-col md:ml-8 justify-between w-full px-2 md:px-0 mt-2 md:mt-0">
              {/* who is/was at the cafe */}
              {selectedDate && isToday(selectedDate) ? (
                <div className="flex flex-col gap-2">
                  <ActiveVisitList
                    suggestions={users}
                    name="employees"
                    label={t("Who's at cafe?")}
                    visits={visits}
                  />
                  <ShiftList
                    key={selectedDate + selectedLocationId + "active"}
                    visits={visits}
                  />
                </div>
              ) : (
                <PreviousVisitList visits={visits} />
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
          {tableColumns?.map((tablesColumns, idx) => (
            <div key={idx + "tablecolumns"}>
              {tablesColumns.map((table) => (
                <div
                  id={`table-large-${table?._id}`}
                  key={table?._id || table?.startHour}
                >
                  <TableCard
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
          {tables?.map((table) => (
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
        <GenericAddEditPanel
          isOpen={isCreateTableDialogOpen}
          close={() => setIsCreateTableDialogOpen(false)}
          inputs={tableInputs}
          setForm={setTableForm}
          formKeys={tableFormKeys}
          constantValues={{
            startHour: format(new Date(), "HH:mm"),
            name: tableForm.name,
            location: selectedLocationId,
            playerCount: 2,
            type: TableTypes.NORMAL,
            isOnlineSale: false,
            isAutoEntryAdded: false,
          }}
          additionalButtons={
            tableForm?.type !== TableTypes.ACTIVITY
              ? [
                  {
                    label: t("Create Without Entry"),
                    isInputRequirementCheck: true,
                    isInputNeedToBeReset: false,
                    onClick: () => {
                      createTable({
                        tableDto: {
                          ...tableForm,
                          date: format(new Date(), "yyyy-MM-dd"),
                          isAutoEntryAdded: false,
                        },
                      } as any);
                      setIsCreateTableDialogOpen(false);
                    },
                  },
                ]
              : []
          }
          submitItem={createTable as any}
          submitFunction={() => {
            createTable({
              tableDto: {
                ...tableForm,
                date: format(new Date(), "yyyy-MM-dd"),
                isAutoEntryAdded: tableForm.type !== TableTypes.ACTIVITY,
              },
            } as any);
          }}
          buttonName={
            tableForm.type !== TableTypes.ACTIVITY
              ? t("Create With Entry")
              : t("Create")
          }
          topClassName="flex flex-col gap-2 "
        />
      )}
      {isConsumptModalOpen && (
        <GenericAddEditPanel
          close={() => {
            setIsConsumptModalOpen(false);
            setIsTabInputScreenOpen(false);
          }}
          inputs={consumptInputs}
          constantValues={{
            location: selectedLocationId,
          }}
          isOpen={isConsumptModalOpen}
          formKeys={consumptFormKeys}
          submitItem={consumptStock as any}
          buttonName={t("Submit")}
          generalClassName="  shadow-none overflow-scroll  no-scrollbar sm:h-[60%] sm:min-w-[60%]  "
          topClassName="flex flex-col gap-2  "
        />
      )}
      {isLossProductModalOpen && (
        <GenericAddEditPanel
          isOpen={isLossProductModalOpen}
          close={() => {
            setIsTabInputScreenOpen(false);
            setIsLossProductModalOpen(false);
          }}
          inputs={orderInputs}
          onOpenTriggerTabInputFormKey={
            user?.settings?.orderCategoryOn ? "category" : "item"
          }
          formKeys={orderFormKeys}
          submitItem={createOrder as any}
          setForm={setOrderForm}
          isCreateCloseActive={false}
          constantValues={{
            quantity: 1,
            stockLocation: selectedLocationId,
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
                stockLocation: selectedLocationId,
                stockNote: StockHistoryStatusEnum.LOSSPRODUCT,
                tableDate: new Date(),
              });
            }
            setOrderForm(initialOrderForm);
          }}
          generalClassName="  shadow-none overflow-scroll  no-scrollbar sm:h-[90%] sm:min-w-[80%]  "
          topClassName="flex flex-col gap-2  "
        />
      )}
      {isTableOrderPaymentModalOpen && tableOrderPaymentTableId && (
        <OrderPaymentModal
          tableId={tableOrderPaymentTableId}
          tables={tables}
          close={() => {
            setExpandedRows({});
            resetOrderContext();
            setIsTableOrderPaymentModalOpen(false);
            setTableOrderPaymentTableId(null);
          }}
        />
      )}

      {isTakeAwayOrderModalOpen && (
        <GenericAddEditPanel
          isOpen={isTakeAwayOrderModalOpen}
          close={() => {
            setOrderCreateBulk([]); //this can be removed if we do not want to loose the bulk order data at close
            setIsTakeAwayOrderModalOpen(false);
            setSelectedNewOrders([]);
            setIsTabInputScreenOpen(false);
          }}
          {...(inactiveCategoriesWithKitchens?.length > 0
            ? {
                upperMessage: inactiveCategoriesWithKitchens.map((category) =>
                  t("{{categoryName}} is not active", {
                    categoryName: category.name,
                  })
                ),
              }
            : {})}
          inputs={orderInputsForTakeAway}
          formKeys={orderFormKeysForTakeAway}
          submitItem={createTable as any}
          setForm={setOrderForm}
          isCreateCloseActive={false}
          optionalCreateButtonActive={orderCreateBulk?.length > 0}
          constantValues={{
            quantity: 1,
            stockLocation: selectedLocationId,
          }}
          onOpenTriggerTabInputFormKey={
            user?.settings?.orderCategoryOn ? "category" : "item"
          }
          buttonName={t("Payment")}
          cancelButtonLabel="Close"
          anotherPanelTopClassName="h-full sm:h-auto flex flex-col   sm:grid grid-cols-1 md:grid-cols-2  w-[98%] md:w-[90%] md:h-[90%] overflow-scroll no-scrollbar sm:overflow-visible  "
          anotherPanel={<OrderTakeawayPanel />}
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
                setSelectedNewOrders([
                  ...selectedNewOrders,
                  orderCreateBulk.length,
                ]);
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
              date: format(new Date(), "yyyy-MM-dd"),
              location: selectedLocationId,
              playerCount: 0,
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
            setIsTakeAwayPaymentModalOpen(true);
            setIsTakeAwayOrderModalOpen(false);
            setSelectedNewOrders([]);
          }}
          generalClassName=" md:rounded-l-none shadow-none overflow-scroll  no-scrollbar  "
          topClassName="flex flex-col gap-2  "
        />
      )}
      {isTakeAwayPaymentModalOpen && takeawayTableId !== 0 && (
        <OrderPaymentModal
          tableId={takeawayTableId}
          tables={tables}
          close={() => {
            setIsTakeAwayPaymentModalOpen(false);
            setTakeawayTableId(0);
            setIsTabInputScreenOpen(false);
          }}
        />
      )}
    </>
  );
};

export default Tables;
