import { useQueryClient } from "@tanstack/react-query";
import { differenceInMinutes, format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { useOrderContext } from "../../context/Order.context";
import { useUserContext } from "../../context/User.context";
import {
  ActionEnum,
  DateRangeKey,
  DisabledConditionEnum,
  OrderStatus,
  Table,
  commonDateOptions,
  orderFilterStatusOptions,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { Paths } from "../../utils/api/factory";
import { useGetSellLocations } from "../../utils/api/location";
import { useGetAllCategories } from "../../utils/api/menu/category";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import {
  useCancelShopifyOrderMutation,
  useGetOrders,
} from "../../utils/api/order/order";
import { useGetOrderDiscounts } from "../../utils/api/order/orderDiscount";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { useGetTables } from "../../utils/api/table";
import { useGetUsersMinimal } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import OrderPaymentModal from "../orders/orderPayment/OrderPaymentModal";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const ShopifyOrders = () => {
  const { t } = useTranslation();
  const orders = useGetOrders();
  const sellLocations = useGetSellLocations();
  const queryClient = useQueryClient();
  const users = useGetUsersMinimal();
  const categories = useGetAllCategories();
  const [rowToAction, setRowToAction] = useState<any>({});
  const discounts = useGetOrderDiscounts();
  const { mutate: cancelShopifyOrder } = useCancelShopifyOrderMutation();
  const [cancelForm, setCancelForm] = useState({ quantity: 1 });
  const [isOrderPaymentModalOpen, setIsOrderPaymentModalOpen] = useState(false);
  const { setExpandedRows } = useGeneralContext();
  const { resetOrderContext } = useOrderContext();
  const [isCancelOrderModalOpen, setIsCancelOrderModalOpen] = useState(false);
  const tables = useGetTables();
  const items = useGetMenuItems();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();

  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
    showOrderDataFilters,
    setShowOrderDataFilters,
  } = useOrderContext();

  const shopifyOrdersPageDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.ORDERDATAS_SHOPIFYORDERS,
      disabledConditions
    );
  }, [disabledConditions]);

  const rows = useMemo(() => {
    if (!orders || !sellLocations || !users || !discounts) {
      return [];
    }
    const allRows = orders
      ?.filter((order) => {
        if (
          order?.shopifyOrderId !== null &&
          order?.shopifyOrderId !== undefined &&
          order?.shopifyOrderId !== ""
        ) {
          if (filterPanelFormElements?.cancelHour !== "") {
            return (
              order?.status === OrderStatus.CANCELLED &&
              order?.cancelledAt &&
              format(order?.cancelledAt, "HH:mm") >=
                filterPanelFormElements?.cancelHour
            );
          }
          return true;
        }
      })
      ?.map((order) => {
        if (!order || !order?.createdAt) {
          return null;
        }
        return {
          ...order,
          isReturned: order?.isReturned,
          date: format(order.createdAt, "yyyy-MM-dd"),
          formattedDate: format(order.createdAt, "dd-MM-yyyy"),
          createdBy: getItem(order?.createdBy, users)?.name ?? "",
          createdHour: format(order.createdAt, "HH:mm") ?? "",
          createdByUserId: order?.createdBy ?? "",
          createdAt: format(order.createdAt, "HH:mm") ?? "",
          preparedBy: getItem(order?.preparedBy, users)?.name ?? "",
          preparedByUserId: order?.preparedBy ?? "",
          preparationTime: order?.preparedAt
            ? differenceInMinutes(order?.preparedAt, order.createdAt) + " dk"
            : "",
          cancelledBy: getItem(order?.cancelledBy, users)?.name ?? "",
          cancelledByUserId: order?.cancelledBy ?? "",
          cancelledAt: order?.cancelledAt
            ? format(order?.cancelledAt, "HH:mm")
            : "",
          deliveredBy: getItem(order?.deliveredBy, users)?.name ?? "",
          deliveredByUserId: order?.deliveredBy ?? "",
          deliveryTime:
            order?.deliveredAt && order?.preparedAt
              ? differenceInMinutes(order?.deliveredAt, order?.preparedAt) +
                " dk"
              : "",
          discountId: order?.discount ?? "",
          discountNote: order?.discountNote ?? "",
          discountAmount: order?.discountAmount
            ? order?.discountAmount
            : parseFloat(
                (
                  (order?.unitPrice *
                    order?.quantity *
                    (order?.discountPercentage ?? 0)) /
                  100
                ).toFixed(2)
              ),

          discountName:
            discounts?.find((discount) => discount?._id === order?.discount)
              ?.name ?? "",
          item: getItem(order?.item, items)?.name ?? "",
          location: getItem(order?.location, sellLocations)?.name ?? "",
          locationId: order?.location ?? "",
          quantity: order?.quantity ?? "",
          tableId: (order?.table as Table)?._id ?? "",
          tableName: (order?.table as Table)?.name ?? "",
          amount: order?.unitPrice * order?.quantity,
          note: order?.note ?? "",
          status: t(order?.status),
          paymentMethod: order?.paymentMethod,
          statusLabel: orderFilterStatusOptions.find(
            (status) => status.value === order?.status
          )?.label,
        };
      })
      ?.filter((item) => item !== null);

    const totalRow = {
      _id: "total",
      className: "font-semibold",
      isSortable: false,
      quantity: allRows?.reduce((acc, row: any) => acc + row.quantity, 0),
      amount: allRows?.reduce((acc, row: any) => acc + row.amount, 0),
      discountAmount: allRows?.reduce(
        (acc, row: any) => acc + row.discountAmount,
        0
      ),
      formattedDate: "Total",
    };
    allRows?.unshift(totalRow as any);
    return allRows;
  }, [
    orders,
    filterPanelFormElements,
    users,
    discounts,
    items,
    sellLocations,
    t,
  ]);

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: true, correspondingKey: "formattedDate" },
      { key: t("Hour"), isSortable: true, correspondingKey: "createdHour" },
      {
        key: t("Shopify Order Number"),
        isSortable: true,
        correspondingKey: "shopifyOrderNumber",
      },
      {
        key: t("Sales Channel"),
        isSortable: true,
        correspondingKey: "paymentMethod",
      },
      { key: t("Product"), isSortable: true, correspondingKey: "item" },
      { key: t("Quantity"), isSortable: true, correspondingKey: "quantity" },
      { key: t("Amount"), isSortable: true, correspondingKey: "amount" },
      {
        key: t("Cancelled At"),
        isSortable: true,
        correspondingKey: "cancelledAt",
      },
      {
        key: t("Cancelled By"),
        isSortable: true,
        correspondingKey: "cancelledBy",
      },
      { key: t("Location"), isSortable: true, correspondingKey: "location" },
      { key: t("Status"), isSortable: true, correspondingKey: "statusLabel" },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "date",
        node: (row: any) => {
          return (
            <p className={`${row?.className} min-w-32 pr-2`}>
              {row.formattedDate}
            </p>
          );
        },
      },
      { key: "createdHour", className: "min-w-40 pr-2" },
      { key: "shopifyOrderNumber", className: "min-w-40 pr-2" },
      { key: "paymentMethod", className: "min-w-40 pr-2" },
      { key: "item", className: "min-w-40 pr-2" },
      {
        key: "quantity",
        node: (row: any) => {
          return (
            <p
              className={`min-w-32 pr-2 ${row.className}`}
              key={row._id + "quantity"}
            >
              {row.quantity}
            </p>
          );
        },
      },
      {
        key: "amount",
        node: (row: any) => (
          <p
            className={`min-w-32 pr-2 ${row.className}`}
            key={row._id + "amount"}
          >
            {row.amount.toFixed(2).replace(/\.?0*$/, "")} ₺
          </p>
        ),
      },
      { key: "cancelledAt" },
      { key: "cancelledBy" },
      { key: "location" },
      { key: "statusLabel", className: "min-w-32 pr-2" },
    ],
    []
  );

  const cancelInputs = useMemo(
    () => [
      {
        type: InputTypes.NUMBER,
        formKey: "quantity",
        label: t("Quantity"),
        placeholder: t("Quantity"),
        minNumber: 1,
        required: true,
        isNumberButtonsActive: true,
        isOnClearActive: false,
      },
    ],
    [t]
  );

  const cancelFormKeys = useMemo(
    () => [{ key: "quantity", type: FormKeyTypeEnum.NUMBER }],
    []
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: sellLocations.map((input) => ({
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
            setFilterPanelFormElements({
              ...filterPanelFormElements,
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
        type: InputTypes.HOUR,
        formKey: "cancelHour",
        label: t("Cancel Hour"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "status",
        label: t("Status"),
        options: orderFilterStatusOptions.map((option) => {
          return {
            value: option.value,
            label: t(option.label),
          };
        }),
        placeholder: t("Status"),
        required: true,
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
        formKey: "item",
        label: t("Menu Item"),
        options: items?.map((item) => {
          return {
            value: item?._id,
            label: item?.name,
          };
        }),
        isMultiple: true,
        placeholder: t("Menu Item"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "discount",
        label: t("Discount"),
        options: discounts.map((discount) => {
          return {
            value: discount._id,
            label: discount.name,
          };
        }),
        isMultiple: true,
        placeholder: t("Discount"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "createdBy",
        label: t("Created By"),
        options: users.map((user) => ({
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
        options: users.map((user) => ({
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
        options: users.map((user) => ({
          value: user._id,
          label: user.name,
        })),
        placeholder: t("Delivered By"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "cancelledBy",
        label: t("Cancelled By"),
        options: users.map((user) => ({
          value: user._id,
          label: user.name,
        })),
        placeholder: t("Cancelled By"),
        required: true,
      },
    ],
    [
      sellLocations,
      t,
      filterPanelFormElements,
      setFilterPanelFormElements,
      categories,
      items,
      discounts,
      users,
    ]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showOrderDataFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      closeFilters: () => setShowOrderDataFilters(false),
      additionalFilterCleanFunction: () => {
        setFilterPanelFormElements(initialFilterPanelFormElements);
      },
    }),
    [
      showOrderDataFilters,
      filterPanelInputs,
      filterPanelFormElements,
      setFilterPanelFormElements,
      setShowOrderDataFilters,
      initialFilterPanelFormElements,
    ]
  );

  const filters = useMemo(
    () => [
      {
        isUpperSide: false,
        node: (
          <ButtonFilter
            buttonName={t("Refresh Data")}
            onclick={() => {
              queryClient.invalidateQueries({
                queryKey: [`${Paths.Order}/query`],
              });
              queryClient.invalidateQueries({
                queryKey: [`${Paths.Order}/collection/query`],
              });
            }}
          />
        ),
        isDisabled: shopifyOrdersPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.REFRESH &&
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
    ],
    [
      t,
      queryClient,
      shopifyOrdersPageDisabledCondition,
      user,
      showOrderDataFilters,
      setShowOrderDataFilters,
    ]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Cancel"),
        icon: <HiOutlineTrash />,
        setRow: setRowToAction,
        className: "text-red-500 cursor-pointer text-2xl  ",
        modal: rowToAction ? (
          <GenericAddEditPanel
            isOpen={isCancelOrderModalOpen}
            topClassName="flex flex-col gap-2 "
            close={() => setIsCancelOrderModalOpen(false)}
            inputs={cancelInputs}
            formKeys={cancelFormKeys}
            setForm={setCancelForm}
            submitItem={cancelShopifyOrder as any}
            constantValues={{
              status: rowToAction.status,
              paidQuantity: rowToAction.paidQuantity,
            }}
            submitFunction={() => {
              if (cancelForm.quantity > rowToAction.quantity) {
                toast.error(
                  t("Quantity cannot be greater than the order quantity.")
                );
                return;
              }
              cancelShopifyOrder({
                shopifyOrderLineItemId: rowToAction.shopifyOrderLineItemId,
                quantity: cancelForm.quantity,
              });
            }}
            isEditMode={false}
          />
        ) : null,
        isModal: true,
        isModalOpen: isCancelOrderModalOpen,
        setIsModal: setIsCancelOrderModalOpen,
        isDisabled: shopifyOrdersPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.DELETE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
    ],
    [
      t,
      rowToAction,
      isCancelOrderModalOpen,
      cancelInputs,
      cancelFormKeys,
      cancelForm,
      cancelShopifyOrder,
      shopifyOrdersPageDisabledCondition,
      user,
    ]
  );

  return (
    <>
      <div className="w-[95%] mx-auto mb-auto ">
        <GenericTable
          title={t("Shopify Orders")}
          columns={columns}
          rowKeys={rowKeys}
          rows={rows}
          isActionsActive={true}
          actions={actions}
          filterPanel={filterPanel}
          filters={filters}
          isExcel={
            user &&
            !shopifyOrdersPageDisabledCondition?.actions?.some(
              (ac) =>
                ac.action === ActionEnum.EXCEL &&
                user?.role?._id &&
                !ac?.permissionsRoles?.includes(user?.role?._id)
            )
          }
          excelFileName={t("ShopifyOrders.xlsx")}
          rowClassNameFunction={(row: any) => {
            if (row?.isReturned) {
              return "bg-red-200";
            }
            return "";
          }}
        />
        {isOrderPaymentModalOpen && rowToAction && (
          <OrderPaymentModal
            tableId={rowToAction.tableId}
            tables={tables}
            isAddOrderActive={false}
            close={() => {
              setExpandedRows({});
              resetOrderContext();
              setIsOrderPaymentModalOpen(false);
            }}
          />
        )}
      </div>
    </>
  );
};

export default ShopifyOrders;
