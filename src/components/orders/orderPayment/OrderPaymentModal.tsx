import { useIsMutating } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../../context/General.context";
import { useLocationContext } from "../../../context/Location.context";
import { useOrderContext } from "../../../context/Order.context";
import {
  MenuItem,
  OptionType,
  Order,
  OrderCollectionStatus,
  OrderStatus,
  TURKISHLIRA,
  Table,
  TableTypes,
} from "../../../types";
import { useGetAllAccountProducts } from "../../../utils/api/account/product";
import { useGetAccountStocks } from "../../../utils/api/account/stock";
import { useGetStockLocations } from "../../../utils/api/location";
import { useGetMemberships } from "../../../utils/api/membership";
import { useGetAllCategories } from "../../../utils/api/menu/category";
import { useGetKitchens } from "../../../utils/api/menu/kitchen";
import { useGetMenuItems } from "../../../utils/api/menu/menu-item";
import {
  useCreateMultipleOrderMutation,
  useGetTableOrders,
  useOrderMutations,
} from "../../../utils/api/order/order";
import { useGetTableCollections } from "../../../utils/api/order/orderCollection";
import { useGetOrderDiscounts } from "../../../utils/api/order/orderDiscount";
import { useGetOrderNotes } from "../../../utils/api/order/orderNotes";
import {
  useCloseTableMutation,
  useReopenTableMutation,
} from "../../../utils/api/table";
import {
  MinimalUser,
  useGetUser,
  useGetUsersMinimal,
} from "../../../utils/api/user";
import { useGetVisits } from "../../../utils/api/visit";
import {
  lockBodyScroll,
  unlockBodyScroll,
} from "../../../utils/bodyScrollLock";
import { formatDate } from "../../../utils/dateUtil";
import { getItem, getMenuItemSubText } from "../../../utils/getItem";
import { ConfirmationDialog } from "../../common/ConfirmationDialog";
import { GenericButton } from "../../common/GenericButton";
import GenericAddEditPanel from "../../panelComponents/FormElements/GenericAddEditPanel";
import SelectInput from "../../panelComponents/FormElements/SelectInput";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../../panelComponents/shared/types";
import OrderListForPanel from "../../tables/OrderListForPanel";
import CollectionModal from "./CollectionModal";
import OrderPaymentTypes from "./OrderPaymentTypes";
import OrderTotal from "./OrderTotal";
import OrderLists from "./orderList/OrderLists";
type Props = {
  close: () => void;
  tableId: number;
  tables: Table[];
  isAddOrderActive?: boolean;
  tableOrdersProp?: Order[];
};
type ButtonType = {
  label: string;
  onClick: () => void;
  isActive: boolean;
};
const OrderPaymentModal = ({
  close,
  tableId,
  tables,
  isAddOrderActive = true,
  tableOrdersProp,
}: Props) => {
  const { t } = useTranslation();
  const user = useGetUser();
  const isMutating = useIsMutating();
  const items = useGetMenuItems();
  const orders = useGetTableOrders(tableId);
  const orderNotes = useGetOrderNotes();
  const { selectedLocationId } = useLocationContext();
  const locations = useGetStockLocations();
  const members = useGetMemberships();
  const { setIsTabInputScreenOpen } = useGeneralContext();
  const users = useGetUsersMinimal();
  const visits = useGetVisits();
  const stocks = useGetAccountStocks();
  useEffect(() => {
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, []);

  const activeUsers = visits
    ?.filter(
      (visit) => !visit?.finishHour && visit.location === selectedLocationId
    )
    ?.map((visit) => visit.user);
  const {
    isCollectionModalOpen,
    setIsCollectionModalOpen,
    setSelectedNewOrders,
    selectedNewOrders,
  } = useOrderContext();
  const [selectedUser, setSelectedUser] = useState<MinimalUser | null>(null);

  // Use user as fallback if selectedUser is not set
  const currentUser = selectedUser || user;
  const userOptions = activeUsers
    .map((user) => {
      const foundUser = users?.find((u) => u?._id === user);
      if (foundUser) {
        return {
          value: user,
          label: foundUser?.name,
        };
      }
      return null;
    })
    .filter((user) => user !== null);
  const getTable = (tableId: number) => {
    const freshTable = tables?.find((table) => table?._id === tableId);
    if (freshTable) {
      return freshTable;
    }
    if (orders?.length > 0) {
      return orders[0]?.table as Table;
    }
  };
  const table = getTable(tableId) as Table;
  const categories = useGetAllCategories();
  const collections = useGetTableCollections(tableId);
  const { mutate: reopenTable } = useReopenTableMutation();
  const [
    isPaymentModalCreateOrderDialogOpen,
    setIsPaymentModalCreateOrderDialogOpen,
  ] = useState(false);
  const discounts = useGetOrderDiscounts();
  const kitchens = useGetKitchens();
  const products = useGetAllAccountProducts();
  const { paymentAmount } = useOrderContext();
  const [selectedActivityUser, setSelectedActivityUser] = useState<string>("");
  const { mutate: createMultipleOrder } = useCreateMultipleOrderMutation();
  const { createOrder } = useOrderMutations();
  const initialOrderForm = {
    item: 0,
    quantity: 0,
    note: "",
    category: "",
    discount: undefined,
    discountNote: "",
    isOnlinePrice: false,
    location: table?.isOnlineSale ? 4 : selectedLocationId,
    stockLocation: selectedLocationId,
    activityTableName: "",
    activityPlayer: "",
  };
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
              k?._id === category.kitchen &&
              k?.selectedUsers &&
              k?.selectedUsers?.length > 0
          )
      ) || []
    );
  }, [inactiveCategories, kitchens]);
  const inactiveCategoriesIds = useMemo(() => {
    return inactiveCategories.map((c) => c?._id);
  }, [inactiveCategories]);
  const [orderForm, setOrderForm] = useState(initialOrderForm);
  const { orderCreateBulk, setOrderCreateBulk } = useOrderContext();
  const [isCloseConfirmationDialogOpen, setIsCloseConfirmationDialogOpen] =
    useState(false);
  const { mutate: closeTable } = useCloseTableMutation();
  const allTableOrders = useMemo(
    () =>
      orders?.filter(
        (order) =>
          (order?.table as Table)?._id === tableId &&
          order.status !== OrderStatus.CANCELLED
      ),
    [orders, tableId]
  );
  const tableOrders = useMemo(
    () =>
      allTableOrders?.filter(
        (order) =>
          selectedActivityUser === "" ||
          order.activityPlayer === selectedActivityUser
      ),
    [allTableOrders, selectedActivityUser]
  );
  const allTotalAmount = useMemo(
    () =>
      allTableOrders?.reduce((acc, order) => {
        return acc + order.unitPrice * order.quantity;
      }, 0),
    [allTableOrders]
  );
  const allCollectionsTotalAmount = useMemo(
    () =>
      Number(
        collections
          ?.filter(
            (collection) => (collection?.table as Table)?._id === tableId
          )
          ?.reduce((acc, collection) => {
            if (collection?.status === OrderCollectionStatus.CANCELLED) {
              return acc;
            }
            return acc + (collection?.amount ?? 0);
          }, 0)
      ),
    [collections, tableId, selectedActivityUser]
  );
  const collectionsTotalAmount = useMemo(
    () =>
      Number(
        collections
          ?.filter(
            (collection) =>
              (collection?.table as Table)?._id === tableId &&
              (selectedActivityUser === "" ||
                collection?.activityPlayer === selectedActivityUser)
          )
          ?.reduce((acc, collection) => {
            if (collection?.status === OrderCollectionStatus.CANCELLED) {
              return acc;
            }
            return acc + (collection?.amount ?? 0);
          }, 0)
      ),
    [collections, tableId, selectedActivityUser]
  );
  const allDiscountAmount = useMemo(
    () =>
      allTableOrders?.reduce((acc, order) => {
        if (!order.discount) {
          return acc;
        }
        const discountValue =
          (order.unitPrice *
            order.quantity *
            (order?.discountPercentage ?? 0)) /
            100 +
          (order?.discountAmount ?? 0) * order.quantity;
        return acc + discountValue;
      }, 0),
    [allTableOrders]
  );
  const totalMoneySpend = collectionsTotalAmount + Number(paymentAmount);
  const allTotalMoneySpend = allCollectionsTotalAmount + Number(paymentAmount);
  const discountAmount = useMemo(
    () =>
      tableOrders?.reduce((acc, order) => {
        if (!order.discount) {
          return acc;
        }
        const discountValue =
          (order.unitPrice *
            order.quantity *
            (order?.discountPercentage ?? 0)) /
            100 +
          (order?.discountAmount ?? 0) * order.quantity;
        return acc + discountValue;
      }, 0),
    [tableOrders]
  );
  const totalAmount = useMemo(
    () =>
      tableOrders?.reduce((acc, order) => {
        return acc + order.unitPrice * order.quantity;
      }, 0),
    [tableOrders]
  );
  const isTableItemsPaid = useMemo(
    () =>
      tableOrders?.every((order) => order.paidQuantity === order.quantity) &&
      collectionsTotalAmount >= totalAmount - discountAmount,
    [tableOrders, collectionsTotalAmount, totalAmount, discountAmount]
  );
  const refundAmount = Math.max(
    totalMoneySpend - (totalAmount - discountAmount),
    allTotalMoneySpend - (allTotalAmount - allDiscountAmount)
  );

  const isAllItemsPaid =
    allTableOrders?.every((order) => order.paidQuantity === order.quantity) &&
    collectionsTotalAmount >= totalAmount - discountAmount;
  const unpaidAmount = Math.min(
    totalAmount - discountAmount - collectionsTotalAmount,
    allTotalAmount - allDiscountAmount - allCollectionsTotalAmount
  );
  const handlePrint = () => {
    const printFrame = document.createElement("iframe");
    printFrame.style.visibility = "hidden";
    printFrame.style.position = "absolute";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    document.body.appendChild(printFrame);
    let totalAmount = 0;
    const content = orders
      ?.filter((order) => order.status !== OrderStatus.CANCELLED)
      ?.map((order) => {
        const discountValue =
          (order.unitPrice * order.quantity * (order.discountPercentage ?? 0)) /
            100 +
          (order.discountAmount ?? 0) * order.quantity;
        const orderAmount = order.unitPrice * order.quantity - discountValue;
        totalAmount += orderAmount;

        const originalPriceText =
          (order?.discountPercentage && order?.discountPercentage > 0) ||
          (order?.discountAmount && order?.discountAmount > 0)
            ? `<span class="original-price">${
                (order.unitPrice * order.quantity).toFixed(2) + TURKISHLIRA
              }</span>`
            : "";

        return `<div class="receipt-item">
                <span class="item-name">(${order.quantity})${
          getItem(order.item, items)?.name
        }</span>
                ${originalPriceText}
                <span class="discounted-price">${
                  orderAmount.toFixed(2) + " " + TURKISHLIRA
                }</span>
              </div>`;
      })
      .join("");
    const totalSection = `<div class="total-section">
                          <span>Toplam:</span>
                          <span>${
                            totalAmount.toFixed(2) + " " + TURKISHLIRA
                          }</span>
                        </div>`;

    const doc = printFrame.contentWindow?.document;
    doc?.open();
    doc?.write(`
    <html>
      <head>
        <title>Print Receipt</title>
          <style>
          body { font-family: 'Courier New', Courier, monospace; margin: 20px; background-color: #f9f9f9; }
          .receipt-item, .total-section { display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 5px; }
          .total-section { font-weight: bold; margin-top: 10px; }
          .item-name { text-align: left; }
          .original-price { text-decoration: line-through;margin-left:auto ; margin-right: 10px; }
          .discounted-price { text-align: right; }
          h1 { text-align: left; border-bottom: 2px solid black; padding-bottom: 10px; }
          .receipt-item { border-bottom: 1px dashed #ccc; }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <h1>Siparişler</h1>
        ${content}
        ${totalSection}
      </body>
    </html>
  `);
    doc?.close();
  };
  const buttons: ButtonType[] = [
    {
      label: t("Add Order"),
      onClick: () => {
        setIsPaymentModalCreateOrderDialogOpen(true);
      },
      isActive: isAddOrderActive && !table?.finishHour,
    },
    {
      label: t("Close Table"),
      onClick: () => {
        const refundAmount =
          collectionsTotalAmount - (totalAmount - discountAmount);
        if (refundAmount > 0) {
          toast.error(
            t("Please refund {{refundAmount}}{{TURKISHLIRA}}", {
              refundAmount,
              TURKISHLIRA,
            })
          );
          // return;
        }
        setIsCloseConfirmationDialogOpen(true);
      },
      isActive: (isAllItemsPaid && !table?.finishHour) ?? false,
    },
    {
      label: t("Open Table"),
      onClick: () => {
        reopenTable({ id: tableId });
      },
      isActive: table?.finishHour ? true : false,
    },
    {
      label: t("Print"),
      onClick: handlePrint,
      isActive: true,
    },
  ];
  const filteredDiscounts = discounts?.filter((discount) =>
    table?.isOnlineSale ? discount?.isOnlineOrder : discount?.isStoreOrder
  );
  const isOnlinePrice = useMemo(() => {
    const menuItem = getItem(orderForm.item, items);
    return Boolean(
      menuItem && getItem(menuItem.category, categories)?.isOnlineOrder
    );
  }, [orderForm.item, items, categories]);
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
  const menuItemOptions = useMemo(() => {
    if (!items) {
      return [];
    }

    return items
      .filter((menuItem) => {
        if (
          orderForm.category &&
          menuItem.category !== Number(orderForm.category)
        ) {
          return false;
        }

        if (inactiveCategoriesIds.includes(menuItem.category)) {
          return false;
        }

        if (!menuItem?.locations?.includes(selectedLocationId)) {
          return false;
        }

        if (
          table?.isOnlineSale &&
          !getItem(menuItem.category, categories)?.isOnlineOrder
        ) {
          return false;
        }

        const category = getItem(menuItem.category, categories);
        if (category?.isLimitedTime && menuItem.endDate) {
          const today = new Date();
          const endDate = new Date(menuItem.endDate);
          if (today > endDate) {
            return false;
          }
        }

        return true;
      })
      .map((menuItem) => {
        const category = getItem(menuItem.category, categories);
        const subText = getMenuItemSubText(menuItem, category, items);

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
            category?.name || "",
          ],
          triggerExtraModal: menuItem?.suggestedDiscount ? true : false,
          subText,
        };
      });
  }, [
    items,
    orderForm.category,
    orderForm.isOnlinePrice,
    inactiveCategoriesIds,
    selectedLocationId,
    table?.isOnlineSale,
    categories,
  ]);
  function finishTable() {
    closeTable({
      id: tableId,
      updates: { finishHour: format(new Date(), "HH:mm") },
    });
    setIsCloseConfirmationDialogOpen(false);
    toast.success(t("Table {{tableName}} closed", { tableName: table?.name }));
  }
  const activityUsers = Array.from(
    new Set(
      orders
        ?.filter(
          (order) =>
            order.status !== OrderStatus.CANCELLED &&
            order?.activityPlayer !== ""
        )
        ?.map((order) => order?.activityPlayer) || []
    )
  );
  const MEMBERDISCOUNTID = 8;
  const memberDiscount = useMemo(() => {
    return discounts?.find((discount) => discount?._id === MEMBERDISCOUNTID);
  }, [discounts]);
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
            value: category?._id,
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
        if (!items) {
          return [];
        }

        return items
          .filter((menuItem) => {
            if (menuItem.category !== value) {
              return false;
            }

            if (inactiveCategoriesIds.includes(menuItem.category)) {
              return false;
            }

            if (!menuItem?.locations?.includes(selectedLocationId)) {
              return false;
            }

            if (
              table?.isOnlineSale &&
              !getItem(menuItem.category, categories)?.isOnlineOrder
            ) {
              return false;
            }

            const category = getItem(menuItem.category, categories);
            if (category?.isLimitedTime && menuItem.endDate) {
              const today = new Date();
              const endDate = new Date(menuItem.endDate);
              if (today > endDate) {
                return false;
              }
            }

            return true;
          })
          .map((menuItem) => {
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
      //     items={items}
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
        ? filteredDiscounts
            .filter((discount) => {
              const menuItem = items?.find(
                (item) => item?._id === orderForm.item
              );
              return getItem(
                menuItem?.category,
                categories
              )?.discounts?.includes(discount?._id);
            })
            ?.map((option) => {
              return {
                value: option?._id,
                label: option?.name,
              };
            })
        : [],
      invalidateKeys: [{ key: "discountNote", defaultValue: "" }],
      suggestedOption: orderForm?.item
        ? getItem(orderForm.item, items)?.suggestedDiscount?.length
          ? getItem(orderForm.item, items)?.suggestedDiscount?.map(
              (discountId: number) => ({
                value: discountId as any,
                label:
                  filteredDiscounts?.find(
                    (discount) => discount?._id === discountId
                  )?.name || "",
              })
            )
          : []
        : [],
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
        discounts?.find((discount) => discount?._id === orderForm.discount)
          ?.note
          ? discounts?.find((discount) => discount?._id === orderForm.discount)
              ?.note
          : t("What is the reason for the discount?"),
      required:
        (orderForm?.discount &&
          orderForm?.discount !== MEMBERDISCOUNTID &&
          discounts?.find((discount) => discount?._id === orderForm.discount)
            ?.isNoteRequired) ??
        false,
      isDisabled:
        (orderForm?.discount === MEMBERDISCOUNTID ||
          (orderForm?.discount &&
            !discounts?.find((discount) => discount?._id === orderForm.discount)
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
      options: locations?.map((input) => {
        const menuItem = getItem(orderForm.item, items);
        const foundProduct = getItem(menuItem?.matchedProduct, products);
        const stockQuantity = menuItem
          ? menuItemStockQuantity(menuItem, input?._id)
          : null;
        const shelfInfo = foundProduct?.shelfInfo?.find(
          (shelf) => shelf.location === input?._id
        );
        return {
          value: input?._id,
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
        (getItem(orderForm.item, items)?.itemProduction?.length ?? 0) > 0,
      isDisabled: !(
        getItem(orderForm.item, items)?.itemProduction?.length ?? 0 > 0
      ),
    },
    {
      type: InputTypes.CHECKBOX,
      formKey: "isOnlinePrice",
      label: t("Online Price"),
      placeholder: t("Online Price"),
      required: isOnlinePrice,
      isDisabled: !isOnlinePrice,
      isTopFlexRow: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "activityTableName",
      label: t("Table"),
      options: table?.tables?.map((tableName) => {
        return {
          value: tableName,
          label: tableName,
        };
      }),
      placeholder: t("Table"),
      required: false,
      isDisabled: table?.type !== TableTypes.ACTIVITY,
    },
    {
      type: InputTypes.TEXT,
      formKey: "activityPlayer",
      label: t("Player Number"),
      placeholder: t("Player Number"),
      required: false,
      isDisabled: table?.type !== TableTypes.ACTIVITY,
      isOnClearActive: true,
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
            const foundItem = getItem(orderForm.item, items);
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
    { key: "discount", type: FormKeyTypeEnum.NUMBER },
    { key: "discountNote", type: FormKeyTypeEnum.STRING },
    { key: "stockLocation", type: FormKeyTypeEnum.NUMBER },
    { key: "isOnlinePrice", type: FormKeyTypeEnum.BOOLEAN },
    { key: "activityTableName", type: FormKeyTypeEnum.STRING },
    { key: "activityPlayer", type: FormKeyTypeEnum.STRING },
    { key: "note", type: FormKeyTypeEnum.STRING },
  ];
  const handleOrderObject = () => {
    const selectedMenuItem = getItem(orderForm?.item, items);
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
        createdBy: currentUser?._id,
        createdAt: new Date(),
        location: table?.isOnlineSale ? 4 : selectedLocationId,
        table: table?._id,
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
        tableDate: new Date(table?.date),
      };
    }
    if (selectedMenuItem && table && !selectedMenuItemCategory?.isAutoServed) {
      return {
        ...orderForm,
        createdAt: new Date(),
        createdBy: currentUser?._id,
        location: table?.isOnlineSale ? 4 : selectedLocationId,
        table: table?._id,
        status: isOrderConfirmationRequired
          ? OrderStatus.CONFIRMATIONREQ
          : OrderStatus.PENDING,
        unitPrice: orderForm?.isOnlinePrice
          ? selectedMenuItem?.onlinePrice ?? selectedMenuItem.price
          : selectedMenuItem.price,
        paidQuantity: 0,
        kitchen: selectedMenuItemCategory?.kitchen,
        stockLocation: orderForm?.stockLocation ?? selectedLocationId,
        tableDate: new Date(table?.date),
      };
    }
    return null;
  };
  if (isPaymentModalCreateOrderDialogOpen) {
    return (
      <GenericAddEditPanel
        isOpen={isPaymentModalCreateOrderDialogOpen}
        close={() => {
          setOrderCreateBulk([]);
          setIsPaymentModalCreateOrderDialogOpen(false);
          setIsTabInputScreenOpen(false);
          setSelectedNewOrders([]);
        }}
        inputs={orderInputs}
        {...(inactiveCategoriesWithKitchens?.length > 0
          ? {
              upperMessage: inactiveCategoriesWithKitchens.map((category) =>
                t("{{categoryName}} is not active", {
                  categoryName: category.name,
                })
              ),
            }
          : {})}
        formKeys={orderFormKeys}
        onOpenTriggerTabInputFormKey={
          user?.settings?.orderCategoryOn ? "category" : "item"
        }
        submitItem={createOrder as any}
        setForm={setOrderForm}
        isCreateCloseActive={false}
        optionalCreateButtonActive={orderCreateBulk?.length > 0}
        allowOptionalSubmitForActivityTable={table.type === TableTypes.ACTIVITY}
        constantValues={{
          quantity: 1,
          stockLocation: selectedLocationId,
          location: table?.isOnlineSale ? 4 : selectedLocationId,
        }}
        isConfirmationDialogRequired={() => {
          const menuItem = items?.find((item) => item?._id === orderForm.item);
          const category = categories?.find(
            (category) => category?._id === menuItem?.category
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
        cancelButtonLabel="Close"
        anotherPanelTopClassName="h-full sm:h-auto flex flex-col   sm:grid grid-cols-1 md:grid-cols-2  w-[98%] md:w-[90%] md:h-[90%] overflow-scroll no-scrollbar sm:overflow-visible  "
        anotherPanel={
          <OrderListForPanel table={table} tableOrdersProp={tableOrdersProp} />
        }
        additionalButtons={[
          {
            label: "Add",
            isInputRequirementCheck: true,
            isInputNeedToBeReset: true,
            preservedKeys: ["activityTableName", "activityPlayer"],
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
                  orders: [
                    ...orderCreateBulk.map((orderCreateBulkItem) => {
                      return {
                        ...orderCreateBulkItem,
                        tableDate: table ? new Date(table?.date) : new Date(),
                        createdBy: currentUser?._id,
                      };
                    }),
                    orderObject,
                  ],
                  table: table,
                });
                setOrderForm(initialOrderForm);
                setOrderCreateBulk([]);
                setSelectedNewOrders([]);
                setIsPaymentModalCreateOrderDialogOpen(false);
                return;
              }
            }
            createMultipleOrder({
              orders: [
                ...orderCreateBulk.map((orderCreateBulkItem) => {
                  return {
                    ...orderCreateBulkItem,
                    tableDate: table ? new Date(table?.date) : new Date(),
                    createdBy: currentUser?._id,
                  };
                }),
              ],
              table: table,
            });
          }
          setOrderForm(initialOrderForm);
          setOrderCreateBulk([]);
          setIsPaymentModalCreateOrderDialogOpen(false);
          setSelectedNewOrders([]);
        }}
        generalClassName=" md:rounded-l-none shadow-none overflow-scroll  no-scrollbar   "
        topClassName="flex flex-col gap-2  "
      />
    );
  }
  if (isCollectionModalOpen) {
    return (
      <CollectionModal
        setIsCollectionModalOpen={setIsCollectionModalOpen}
        table={table}
        orders={orders}
        collections={collections}
      />
    );
  }
  return (
    <div
      id="popup"
      className="z-[99999] fixed w-full h-full inset-0 flex justify-center items-center"
    >
      <div
        onClick={close}
        className="w-full h-full bg-gray-900 bg-opacity-50 absolute inset-0 "
      />
      {isMutating ? (
        <div className="fixed inset-0 w-full h-full z-50">
          -
          <div className="absolute inset-0 w-full h-full z-50 opacity-50 bg-black text-white">
            <div className="flex justify-center w-full h-full items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <h1 className="text-2xl">Loading...</h1>
            </div>
          </div>
        </div>
      ) : null}
      <div className="relative w-[95%] h-[98%]  overflow-y-auto">
        <div className="bg-white rounded-md shadow overflow-y-auto sm:h-full items-center ">
          <div className="border border-gray-200 rounded-lg pb-3 __className_a182b8 h-full ">
            <IoMdCloseCircleOutline
              className="absolute top-2 right-2 text-2xl text-red-300 hover:text-red-500 cursor-pointer "
              onClick={close}
            />
            <div className="flex flex-col gap-4 h-full">
              {/* header & buttons */}
              <div className="flex flex-row justify-between items-center px-4 bg-blue-gray-50 rounded-t-lg py-1">
                {/* header */}
                <div className="flex flex-col gap-1">
                  <div className="flex flex-row gap-4 ">
                    <h1 className="font-medium">
                      <span className="font-semibold">{t("Table")}</span>:{" "}
                      {table?.name}
                    </h1>
                    {table && (
                      <div className="font-medium">
                        <span>
                          {table?.date &&
                            format(new Date(table.date), "dd/MM/yyyy")}
                        </span>
                        {table?.startHour && <span> - {table?.startHour}</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row gap-2  items-center">
                    {table?.type === TableTypes.ACTIVITY && (
                      <div className="z-50">
                        <SelectInput
                          value={{
                            value: selectedActivityUser,
                            label:
                              selectedActivityUser === ""
                                ? t("All Players")
                                : selectedActivityUser,
                          }}
                          options={
                            [
                              ...activityUsers.map((u) => {
                                return {
                                  value: u,
                                  label: u,
                                };
                              }),
                              { value: "", label: t("All Players") },
                            ] as any
                          }
                          isMultiple={false}
                          onChange={(value) => {
                            setSelectedActivityUser(
                              (value as OptionType).value
                            );
                          }}
                          isOnClearActive={true}
                        />
                      </div>
                    )}
                    <div className="flex flex-row flex-wrap gap-2">
                      {userOptions && userOptions?.length > 0 ? (
                        userOptions?.map((userOption) => {
                          const foundUser = getItem(
                            String(userOption?.value),
                            users
                          );
                          if (!foundUser) return null;
                          return (
                            <a
                              key={foundUser?._id}
                              onClick={() => setSelectedUser(foundUser)}
                              className={`  px-4 py-2 rounded-lg focus:outline-none cursor-pointer  font-medium ${
                                foundUser?._id === currentUser?._id
                                  ? "bg-gray-200 hover:bg-gray-300 text-red-300 hover:text-red-500 shadow-md focus:outline-none"
                                  : "bg-white hover:bg-gray-200 text-gray-600 hover:text-red-500"
                              } `}
                            >
                              {foundUser?.name}
                            </a>
                          );
                        })
                      ) : (
                        <h1 className="font-medium">{user?.name}</h1>
                      )}
                    </div>
                  </div>
                </div>
                {/* buttons */}
                <div className="flex flex-row flex-wrap gap-2 sm:gap-5 ml-auto mr-6 ">
                  {buttons?.map((button) => {
                    if (button.isActive) {
                      return (
                        <GenericButton
                          key={button.label}
                          onClick={button.onClick}
                          variant="ghost"
                          className="w-fit !bg-gray-200 px-2 sm:px-4 py-1 sm:py-2 rounded-lg shadow-md hover:!bg-gray-300 !text-red-300 hover:!text-red-500 font-semibold"
                        >
                          {button.label}
                        </GenericButton>
                      );
                    }
                  })}
                </div>
              </div>
              {/* payment part */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 py-2 h-full min-h-0">
                <OrderLists
                  table={table}
                  tableOrders={tableOrders}
                  collectionsTotalAmount={collectionsTotalAmount}
                  tables={tables}
                  totalAmount={totalAmount}
                  discountAmount={discountAmount}
                  unpaidAmount={unpaidAmount}
                />
                <OrderTotal
                  tableOrders={tableOrders}
                  table={table}
                  collectionsTotalAmount={collectionsTotalAmount}
                  refundAmount={refundAmount}
                  unpaidAmount={unpaidAmount}
                />
                {currentUser && (
                  <OrderPaymentTypes
                    table={table}
                    tableOrders={tableOrders}
                    collectionsTotalAmount={collectionsTotalAmount}
                    selectedActivityUser={selectedActivityUser}
                    givenDateOrders={orders ?? []}
                    givenDateCollections={collections ?? []}
                    user={currentUser}
                    allCollectionsTotalAmount={allCollectionsTotalAmount}
                    allTotalAmount={allTotalAmount}
                    allTableOrders={allTableOrders}
                    isTableItemsPaid={isTableItemsPaid}
                    totalMoneySpend={totalMoneySpend}
                    totalAmount={totalAmount}
                    discountAmount={discountAmount}
                    allTotalMoneySpend={allTotalMoneySpend}
                    allDiscountAmount={allDiscountAmount}
                    refundAmount={refundAmount}
                  />
                )}
              </div>
            </div>
          </div>
          <ConfirmationDialog
            isOpen={isCloseConfirmationDialogOpen}
            close={() => {
              setIsCloseConfirmationDialogOpen(false);
            }}
            confirm={() => {
              finishTable();
              close();
            }}
            title={t("Close Table")}
            text={t("Table is being closed. Are you sure?")}
          />
        </div>
      </div>
    </div>
  );
};
export default OrderPaymentModal;
