import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
} from "react-icons/md";
import { Header } from "../components/header/Header";
import Loading from "../components/common/Loading";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useGeneralContext } from "../context/General.context";
import { useOrderContext } from "../context/Order.context";
import { useUserContext } from "../context/User.context";
import {
  ActionEnum,
  DateRangeKey,
  DisabledConditionEnum,
  Order,
  OrderStatus,
  Table,
  commonDateOptions,
  orderFilterStatusOptions,
} from "../types";
import { dateRanges } from "../utils/api/dateRanges";
import { useGetAllLocations } from "../utils/api/location";
import { useGetCategories } from "../utils/api/menu/category";
import { useGetMenuItems } from "../utils/api/menu/menu-item";
import {
  useGetShopifyPickUpOrders,
  useShopifyPickUpOrderMutation,
} from "../utils/api/order/order";
import { useGetDisabledConditions } from "../utils/api/panelControl/disabledCondition";
import { useGetUsersMinimal } from "../utils/api/user";
import { getItem } from "../utils/getItem";

const QUIZ_TICKET_MENU_CATEGORY_ID = 9;

const ShopifyPickUp = () => {
  const { t } = useTranslation();
  const orders = useGetShopifyPickUpOrders();
  const locations = useGetAllLocations();
  const users = useGetUsersMinimal();
  const { user } = useUserContext();
  const { setExpandedRows } = useGeneralContext();
  const categories = useGetCategories();
  const { updateSimpleOrder, updateSimpleOrdersBulk, isPending } =
    useShopifyPickUpOrderMutation();
  const items = useGetMenuItems();
  const disabledConditions = useGetDisabledConditions();
  const {
    shopifyPickUpFilterPanelFormElements,
    setShopifyPickUpFilterPanelFormElements,
    initialShopifyPickUpFilterPanelFormElements,
    showOrderDataFilters,
    setShowOrderDataFilters,
    showPickedOrders,
    setShowPickedOrders,
  } = useOrderContext();

  const [showQuizTicketPickUpOrders, setShowQuizTicketPickUpOrders] =
    useState(false);

  const shopifyPickUpDisabledCondition = useMemo(() => {
    return getItem(DisabledConditionEnum.SHOPIFY_PICK_UP, disabledConditions);
  }, [disabledConditions]);

  const rows = useMemo(() => {
    const filtered = orders?.filter((order) => {
      if (!order || !order?.createdAt) return false;
      if (
        !showQuizTicketPickUpOrders &&
        getItem(order?.item, items)?.category === QUIZ_TICKET_MENU_CATEGORY_ID
      ) {
        return false;
      }
      return (
        order?.shopifyOrderId !== null &&
        order?.shopifyOrderId !== undefined &&
        order?.shopifyOrderId !== "" &&
        order?.shopifyCustomer &&
        order?.status !== OrderStatus.CANCELLED
      );
    });

    // Group by shopifyOrderId
    const groups = new Map<string, Order[]>();
    filtered?.forEach((order) => {
      const key = order?.shopifyOrderId as string;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(order);
    });

    return Array.from(groups.entries())
      .map(([, groupOrders]) => {
        const first = groupOrders[0];
        const allPicked = groupOrders.every((o) => o.isShopifyCustomerPicked);

        if (!showPickedOrders && allPicked) return null;

        const createHour = format(first.createdAt, "HH:mm") ?? "";
        const pickedOrder =
          groupOrders.find((o) => o.isShopifyCustomerPicked) ?? first;
        const deliveryHour =
          pickedOrder?.deliveredAt &&
          pickedOrder?.deliveredAt !== pickedOrder?.createdAt
            ? format(pickedOrder?.deliveredAt, "HH:mm")
            : "";

        return {
          _id: first._id,
          orderIds: groupOrders.map((o) => o._id),
          isReturned: groupOrders.some((o) => o.isReturned),
          date: format(first.createdAt, "yyyy-MM-dd"),
          formattedDate: format(first.createdAt, "dd-MM-yyyy"),
          createdAt: createHour,
          deliveredBy: getItem(pickedOrder?.deliveredBy, users)?.name ?? "",
          deliveredByUserId: pickedOrder?.deliveredBy ?? "",
          deliveredAt:
            deliveryHour !== createHour ? deliveryHour : "",
          location:
            getItem(first?.shopifyCustomer?.location, locations)?.name ?? "",
          locationId: first?.shopifyCustomer?.location ?? "",
          tableId: (first?.table as Table)?._id ?? "",
          tableName: (first?.table as Table)?.name ?? "",
          amount: groupOrders.reduce(
            (sum, o) => sum + o.unitPrice * o.quantity,
            0
          ),
          shopifyOrderId: first.shopifyOrderId,
          shopifyOrderNumber: first.shopifyOrderNumber,
          customerFirstName: first?.shopifyCustomer?.firstName ?? "",
          customerLastName: first?.shopifyCustomer?.lastName ?? "",
          customerEmail: first?.shopifyCustomer?.email ?? "",
          customerPhone: first?.shopifyCustomer?.phone ?? "",
          statusLabel: orderFilterStatusOptions.find(
            (status) => status.value === first?.status
          )?.label,
          isShopifyCustomerPicked: allPicked,
          collapsible: {
            collapsibleHeader: t("Products"),
            collapsibleColumns: [
              { key: t("Product"), isSortable: false },
              { key: t("Quantity"), isSortable: false },
              { key: t("Amount"), isSortable: false },
              { key: t("Brought to Pick-Up Point"), isSortable: false, className: "text-center" },
            ],
            collapsibleRows: groupOrders.map((order) => ({
              _id: order._id,
              item: getItem(order?.item, items)?.name ?? "",
              quantity: order?.quantity ?? "",
              amount: order?.unitPrice * order?.quantity,
              isShopifyPickUpOrderBrought:
                order?.isShopifyPickUpOrderBrought ?? false,
            })),
            collapsibleRowKeys: [
              { key: "item" },
              { key: "quantity" },
              {
                key: "amount",
                node: (row: any) => (
                  <p key={row._id + "amount"}>
                    {row.amount.toFixed(2).replace(/\.?0*$/, "")} ₺
                  </p>
                ),
              },
              {
                key: "isShopifyPickUpOrderBrought",
                node: (row: any) => {
                  const CheckboxComponent = row?.isShopifyPickUpOrderBrought
                    ? MdOutlineCheckBox
                    : MdOutlineCheckBoxOutlineBlank;
                  return (
                    <div className="flex justify-center">
                      <CheckboxComponent
                        key={row._id + "shopify-brought-checkbox"}
                        className="text-2xl cursor-pointer hover:scale-105"
                        onClick={() =>
                          updateSimpleOrder({
                            id: row._id,
                            updates: {
                              isShopifyPickUpOrderBrought:
                                !row.isShopifyPickUpOrderBrought,
                            },
                          })
                        }
                      />
                    </div>
                  );
                },
              },
            ],
          },
        };
      })
      .filter(Boolean);
  }, [
    orders,
    showPickedOrders,
    showQuizTicketPickUpOrders,
    users,
    items,
    locations,
    t,
    updateSimpleOrder,
  ]);

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: true, correspondingKey: "formattedDate" },
      {
        key: t("Created At"),
        isSortable: true,
        correspondingKey: "createdAt",
      },
      {
        key: t("Order Number"),
        isSortable: true,
        correspondingKey: "shopifyOrderNumber",
      },
      {
        key: t("Name"),
        isSortable: true,
        correspondingKey: "customerFirstName",
      },
      {
        key: t("Last Name"),
        isSortable: true,
        correspondingKey: "customerLastName",
      },
      { key: "Email", isSortable: true, correspondingKey: "customerEmail" },
      { key: t("Phone"), isSortable: true, correspondingKey: "customerPhone" },
      { key: t("Amount"), isSortable: true, correspondingKey: "amount" },
      { key: t("Location"), isSortable: true, correspondingKey: "location" },
      {
        key: t("Delivered By"),
        isSortable: true,
        correspondingKey: "deliveredBy",
      },
      {
        key: t("Delivered At"),
        isSortable: true,
        correspondingKey: "deliveredAt",
      },
      { key: t("Delivered"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "date",
        node: (row: any) => (
          <p className={`${row?.className} min-w-32 pr-2`}>
            {row.formattedDate}
          </p>
        ),
      },
      { key: "createdAt" },
      { key: "shopifyOrderNumber", className: "min-w-32 pr-2" },
      { key: "customerFirstName", className: "min-w-32 pr-2" },
      { key: "customerLastName", className: "min-w-32 pr-2" },
      { key: "customerEmail", className: "min-w-32 pr-2" },
      { key: "customerPhone", className: "min-w-32 pr-2" },
      {
        key: "amount",
        node: (row: any) => (
          <p className={`min-w-32 pr-2 ${row.className}`} key={row._id + "amount"}>
            {row.amount.toFixed(2).replace(/\.?0*$/, "")} ₺
          </p>
        ),
      },
      { key: "location" },
      { key: "deliveredBy" },
      { key: "deliveredAt" },
      {
        key: "isShopifyCustomerPicked",
        node: (row: any) => {
          return row?.isShopifyCustomerPicked ? (
            <MdOutlineCheckBox
              id="shopify-pickup-checkbox"
              key={row._id + "shopify-pickup-checkbox"}
              className="my-auto mx-auto text-2xl cursor-pointer hover:scale-105"
              onClick={() => {
                setExpandedRows({});
                updateSimpleOrdersBulk({
                  ids: row.orderIds,
                  updates: { isShopifyCustomerPicked: false },
                });
              }}
            />
          ) : (
            <MdOutlineCheckBoxOutlineBlank
              id="shopify-pickup-checkbox"
              key={row._id + "shopify-pickup-checkbox"}
              className="my-auto mx-auto text-2xl cursor-pointer hover:scale-105"
              onClick={() => {
                setExpandedRows({});
                updateSimpleOrdersBulk({
                  ids: row.orderIds,
                  updates: {
                    isShopifyCustomerPicked: true,
                    deliveredAt: new Date(),
                    deliveredBy: user?._id,
                  },
                });
              }}
            />
          );
        },
      },
    ],
    [updateSimpleOrdersBulk, user, setExpandedRows]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: locations.map((input) => ({
          value: input._id,
          label: input.name,
        })),
        placeholder: t("Location"),
        required: true,
        isMultiple: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "date",
        label: t("Date"),
        options: commonDateOptions.map((option) => {
          return {
            value: option.value,
            label: t(option.label),
          };
        }),
        placeholder: t("Date"),
        required: true,
        additionalOnChange: ({
          value,
          label,
        }: {
          value: string;
          label: string;
        }) => {
          const dateRange = dateRanges[value as DateRangeKey];
          if (dateRange) {
            setShopifyPickUpFilterPanelFormElements({
              ...shopifyPickUpFilterPanelFormElements,
              ...dateRange(),
            });
          }
        },
      },
      {
        type: InputTypes.DATE,
        formKey: "after",
        label: t("Start Date"),
        placeholder: t("Start Date"),
        required: true,
        isDatePicker: true,
        invalidateKeys: [{ key: "date", defaultValue: "" }],
        isOnClearActive: false,
      },
      {
        type: InputTypes.DATE,
        formKey: "before",
        label: t("End Date"),
        placeholder: t("End Date"),
        required: true,
        isDatePicker: true,
        invalidateKeys: [{ key: "date", defaultValue: "" }],
        isOnClearActive: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "category",
        label: t("Category"),
        options: categories?.map((category) => {
          return {
            value: category?._id,
            label: category?.name,
          };
        }),
        isMultiple: true,
        placeholder: t("Category"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "createdBy",
        label: t("Created By"),
        options: users?.map((user) => ({
          value: user._id,
          label: user.name,
        })),
        placeholder: t("Created By"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "preparedBy",
        label: t("Prepared By"),
        options: users?.map((user) => ({
          value: user._id,
          label: user.name,
        })),
        placeholder: t("Prepared By"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "deliveredBy",
        label: t("Delivered By"),
        options: users?.map((user) => ({
          value: user._id,
          label: user.name,
        })),
        placeholder: t("Delivered By"),
        required: true,
      },
    ],
    [
      locations,
      t,
      shopifyPickUpFilterPanelFormElements,
      setShopifyPickUpFilterPanelFormElements,
      categories,
      users,
    ]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showOrderDataFilters,
      inputs: filterPanelInputs,
      formElements: shopifyPickUpFilterPanelFormElements,
      setFormElements: setShopifyPickUpFilterPanelFormElements,
      closeFilters: () => setShowOrderDataFilters(false),
      additionalFilterCleanFunction: () => {
        setShopifyPickUpFilterPanelFormElements(
          initialShopifyPickUpFilterPanelFormElements
        );
      },
    }),
    [
      showOrderDataFilters,
      filterPanelInputs,
      shopifyPickUpFilterPanelFormElements,
      setShopifyPickUpFilterPanelFormElements,
      setShowOrderDataFilters,
      initialShopifyPickUpFilterPanelFormElements,
    ]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Picked Orders"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showPickedOrders}
            onChange={() => {
              setShowPickedOrders(!showPickedOrders);
            }}
          />
        ),
        isDisabled: shopifyPickUpDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.SHOW_RECEIVED_ORDERS &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showOrderDataFilters}
            onChange={() => {
              setShowOrderDataFilters(!showOrderDataFilters);
            }}
          />
        ),
      },
      {
        label: t("Show Tickets"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showQuizTicketPickUpOrders}
            onChange={() => {
              setShowQuizTicketPickUpOrders(!showQuizTicketPickUpOrders);
            }}
          />
        ),
      },
    ],
    [
      t,
      showPickedOrders,
      setShowPickedOrders,
      showOrderDataFilters,
      setShowOrderDataFilters,
      showQuizTicketPickUpOrders,
      shopifyPickUpDisabledCondition,
      user,
    ]
  );

  return (
    <>
      {isPending && <Loading />}
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-2 mt-5 ">
        <div className="w-[95%] mx-auto mb-auto ">
          <GenericTable
            title={t("Shopify Pick Up")}
            columns={columns}
            rowKeys={rowKeys as any}
            rows={rows as any}
            isActionsActive={false}
            filterPanel={filterPanel}
            filters={filters}
            isCollapsible={true}
            isExcel={
              !shopifyPickUpDisabledCondition?.actions?.some(
                (ac) =>
                  ac.action === ActionEnum.EXCEL &&
                  user?.role?._id &&
                  !ac?.permissionsRoles?.includes(user?.role?._id)
              )
            }
            excelFileName={"ShopifyPickUp.xlsx"}
            rowClassNameFunction={(row: any) => {
              if (row?.isReturned) {
                return "bg-red-200";
              }
              return "";
            }}
          />
        </div>
      </div>
    </>
  );
};

export default ShopifyPickUp;
