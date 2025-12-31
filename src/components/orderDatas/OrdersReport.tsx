import { useQueryClient } from "@tanstack/react-query";
import { differenceInMinutes, format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { PiArrowArcLeftBold } from "react-icons/pi";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { useOrderContext } from "../../context/Order.context";
import { useUserContext } from "../../context/User.context";
import {
  ActionEnum,
  DateRangeKey,
  DisabledConditionEnum,
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
  useGetOrders,
  useReturnOrdersMutation,
} from "../../utils/api/order/order";
import { useGetOrderDiscounts } from "../../utils/api/order/orderDiscount";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { useGetTables } from "../../utils/api/table";
import { useGetUsersMinimal } from "../../utils/api/user";
import { convertDateFormat, formatDateInTurkey } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import OrderPaymentModal from "../orders/orderPayment/OrderPaymentModal";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const OrdersReport = () => {
  const { t } = useTranslation();
  const orders = useGetOrders();
  const sellLocations = useGetSellLocations();
  const queryClient = useQueryClient();
  const users = useGetUsersMinimal();
  const categories = useGetAllCategories();
  const [rowToAction, setRowToAction] = useState<any>({});
  const discounts = useGetOrderDiscounts();
  const [isOrderPaymentModalOpen, setIsOrderPaymentModalOpen] = useState(false);
  const { setExpandedRows } = useGeneralContext();
  const { resetOrderContext } = useOrderContext();
  const tables = useGetTables();
  const items = useGetMenuItems();
  const [isReturnOrderModalOpen, setIsReturnOrderModalOpen] = useState(false);
  const { mutate: returnOrder } = useReturnOrdersMutation();
  const [returnOrderForm, setReturnOrderForm] = useState<any>({
    quantity: 0,
  });
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();

  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
    showOrderDataFilters,
    setShowOrderDataFilters,
  } = useOrderContext();

  const ordersPageDisabledCondition = useMemo(() => {
    return getItem(DisabledConditionEnum.ORDERDATAS_ORDERS, disabledConditions);
  }, [disabledConditions]);

  const returnOrderInputs = useMemo(
    () => [
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
    ],
    [t]
  );

  const returnOrderFormElements = useMemo(
    () => [{ key: "quantity", type: FormKeyTypeEnum.NUMBER }],
    []
  );

  const rows = useMemo(() => {
    if (!orders || !sellLocations || !users || !discounts) {
      return [];
    }
    const allRows = orders
      ?.filter(
        (order) =>
          !(
            order?.ikasId !== null &&
            order?.ikasId !== undefined &&
            order?.ikasId !== ""
          )
      )
      ?.map((order) => {
        if (!order || !order?.createdAt) {
          return null;
        }
        return {
          _id: order?._id,
          isReturned: order?.isReturned,
          date: formatDateInTurkey(order.createdAt),
          formattedDate: convertDateFormat(
            format(order.createdAt, "yyyy-MM-dd")
          ),
          createdBy: getItem(order?.createdBy, users)?.name ?? "",
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
  }, [orders, users, discounts, items, sellLocations, t]);

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: true, correspondingKey: "formattedDate" },
      { key: t("Table Id"), isSortable: true, correspondingKey: "tableId" },
      { key: t("Table Name"), isSortable: true, correspondingKey: "tableName" },
      { key: t("Product"), isSortable: true, correspondingKey: "item" },
      { key: t("Quantity"), isSortable: true, correspondingKey: "quantity" },
      { key: t("Amount"), isSortable: true, correspondingKey: "amount" },
      {
        key: t("Discount"),
        isSortable: true,
        correspondingKey: "discountName",
      },
      {
        key: t("Discount Amount"),
        isSortable: true,
        correspondingKey: "discountAmount",
      },
      {
        key: t("Discount Note"),
        isSortable: true,
        correspondingKey: "discountNote",
      },
      { key: t("Note"), isSortable: true, correspondingKey: "note" },
      { key: t("Created At"), isSortable: true, correspondingKey: "createdAt" },
      { key: t("Created By"), isSortable: true, correspondingKey: "createdBy" },
      {
        key: t("Prepared In"),
        isSortable: true,
        correspondingKey: "preparationTime",
      },
      {
        key: t("Prepared By"),
        isSortable: true,
        correspondingKey: "preparedBy",
      },
      {
        key: t("Delivered In"),
        isSortable: true,
        correspondingKey: "deliveryTime",
      },
      {
        key: t("Delivered By"),
        isSortable: true,
        correspondingKey: "deliveredBy",
      },
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
      { key: t("Status"), isSortable: true, correspondingKey: "status" },
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
            <p className={`${row?.className} min-w-32 pr-2`}>{row.date}</p>
          );
        },
      },
      {
        key: "tableId",
        node: (row: any) => {
          return (
            <p
              className="text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
              onClick={() => {
                setRowToAction(row);
                setIsOrderPaymentModalOpen(true);
              }}
            >
              {row.tableId}
            </p>
          );
        },
      },
      { key: "tableName", className: "min-w-40 pr-2" },
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
            {row.amount} ₺
          </p>
        ),
      },
      { key: "discountName" },
      {
        key: "discountAmount",
        node: (row: any) => (
          <p
            className={`min-w-32 pr-2 ${row.className}`}
            key={row._id + "discountAmount"}
          >
            {Number(row.discountAmount) !== 0 && row?.discount
              ? row.discountAmount + "₺"
              : "-"}
          </p>
        ),
      },
      { key: "discountNote", className: "min-w-32 pr-2" },
      { key: "note", className: "min-w-32 pr-2" },
      { key: "createdAt" },
      { key: "createdBy" },
      { key: "preparationTime" },
      { key: "preparedBy" },
      { key: "deliveryTime" },
      { key: "deliveredBy" },
      { key: "cancelledAt" },
      { key: "cancelledBy" },
      { key: "location" },
      { key: "statusLabel", className: "min-w-32 pr-2" },
    ],
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
        isDisabled: ordersPageDisabledCondition?.actions?.some(
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
      ordersPageDisabledCondition,
      user,
      showOrderDataFilters,
      setShowOrderDataFilters,
    ]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Return"),
        icon: <PiArrowArcLeftBold />,
        className: "text-blue-500 cursor-pointer text-xl mx-auto",
        isModal: true,
        setRow: setRowToAction,
        setForm: setReturnOrderForm,
        onClick: (row: any) => {
          setReturnOrderForm({
            quantity: row.quantity,
          });
        },
        modal: rowToAction ? (
          <GenericAddEditPanel
            isOpen={isReturnOrderModalOpen}
            close={() => setIsReturnOrderModalOpen(false)}
            inputs={returnOrderInputs}
            formKeys={returnOrderFormElements}
            setForm={setReturnOrderForm}
            submitItem={returnOrder as any}
            submitFunction={() => {
              if (
                returnOrderForm.quantity <= 0 ||
                returnOrderForm.quantity > rowToAction.quantity
              ) {
                toast.error("Invalid Quantity");
                return;
              }
              returnOrder({
                orderId: rowToAction._id,
                returnQuantity: returnOrderForm.quantity,
                paymentMethod: rowToAction?.paymentMethod ?? "cash",
              });
            }}
            constantValues={{
              quantity: rowToAction.quantity,
            }}
            topClassName="flex flex-col gap-2 "
            generalClassName="overflow-visible"
          />
        ) : null,
        isModalOpen: isReturnOrderModalOpen,
        setIsModal: setIsReturnOrderModalOpen,
        isPath: false,
        isDisabled: ordersPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.REFUND &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
    ],
    [
      t,
      rowToAction,
      isReturnOrderModalOpen,
      returnOrderInputs,
      returnOrderFormElements,
      returnOrderForm,
      returnOrder,
      ordersPageDisabledCondition,
      user,
    ]
  );

  return (
    <>
      <div className="w-[95%] mx-auto mb-auto ">
        <GenericTable
          title={t("Cafe Orders")}
          columns={columns}
          rowKeys={rowKeys}
          rows={rows}
          isActionsActive={true}
          actions={actions}
          filterPanel={filterPanel}
          filters={filters}
          isExcel={
            user &&
            !ordersPageDisabledCondition?.actions?.some(
              (ac) =>
                ac.action === ActionEnum.EXCEL &&
                user?.role?._id &&
                !ac?.permissionsRoles?.includes(user?.role?._id)
            )
          }
          excelFileName={t("Orders.xlsx")}
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

export default OrdersReport;
