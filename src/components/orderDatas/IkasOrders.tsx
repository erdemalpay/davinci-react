import { useQueryClient } from "@tanstack/react-query";
import { differenceInMinutes, format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { useGeneralContext } from "../../context/General.context";
import { useOrderContext } from "../../context/Order.context";
import {
  commonDateOptions,
  DateRangeKey,
  OrderStatus,
  Table,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { Paths } from "../../utils/api/factory";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import {
  useCancelIkasOrderMutation,
  useGetOrders,
} from "../../utils/api/order/order";
import { useGetOrderDiscounts } from "../../utils/api/order/orderDiscount";
import { useGetTables } from "../../utils/api/table";
import { useGetUsers } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import { LocationInput } from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import OrderPaymentModal from "../orders/orderPayment/OrderPaymentModal";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";

const IkasOrders = () => {
  const { t } = useTranslation();
  const orders = useGetOrders();
  const locations = useGetStoreLocations();
  const queryClient = useQueryClient();
  const users = useGetUsers();
  const [showFilters, setShowFilters] = useState(false);
  const [rowToAction, setRowToAction] = useState<any>({});
  const discounts = useGetOrderDiscounts();
  const { mutate: cancelIkasOrder } = useCancelIkasOrderMutation();
  const [isOrderPaymentModalOpen, setIsOrderPaymentModalOpen] = useState(false);
  const { setExpandedRows } = useGeneralContext();
  const { resetOrderContext } = useOrderContext();
  const [isCancelOrderModalOpen, setIsCancelOrderModalOpen] = useState(false);
  const tables = useGetTables();
  const items = useGetMenuItems();
  const [tableKey, setTableKey] = useState(0);

  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
  } = useOrderContext();
  if (!orders || !locations || !users || !discounts) {
    return null;
  }
  const statusOptions = [
    { value: OrderStatus.PENDING, label: t("Pending") },
    { value: OrderStatus.READYTOSERVE, label: t("Ready to Serve") },
    { value: OrderStatus.SERVED, label: t("Served") },
    { value: OrderStatus.CANCELLED, label: t("Cancelled") },
    { value: OrderStatus.AUTOSERVED, label: t("Auto served") },
    { value: OrderStatus.WASTED, label: t("Loss Product") },
    { value: OrderStatus.RETURNED, label: t("Returned") },
  ];
  const allRows = orders
    ?.filter(
      (order) =>
        order?.ikasId !== null &&
        order?.ikasId !== undefined &&
        order?.ikasId !== ""
    )
    ?.map((order) => {
      if (!order || !order?.createdAt) {
        return null;
      }

      return {
        _id: order?._id,
        isReturned: order?.isReturned,
        date: format(order.createdAt, "yyyy-MM-dd"),
        formattedDate: format(order.createdAt, "dd-MM-yyyy"),
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
            ? differenceInMinutes(order?.deliveredAt, order?.preparedAt) + " dk"
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
        location: getItem(order?.location, locations)?.name ?? "",
        locationId: order?.location ?? "",
        quantity: order?.quantity ?? "",
        tableId: (order?.table as Table)?._id ?? "",
        tableName: (order?.table as Table)?.name ?? "",
        amount: order?.unitPrice * order?.quantity,
        note: order?.note ?? "",
        status: t(order?.status),
        paymentMethod: order?.paymentMethod,
        ikasId: order?.ikasId,
        statusLabel: statusOptions.find(
          (status) => status.value === order?.status
        )?.label,
      };
    })
    ?.filter((item) => item !== null);
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Date"), isSortable: true, correspondingKey: "formattedDate" },
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
    { key: t("Status"), isSortable: true, correspondingKey: "status" },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [
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
    { key: "item", className: "min-w-40 pr-2" },
    { key: "quantity" },
    {
      key: "amount",
      node: (row: any) => (
        <p className="min-w-32 pr-2" key={row._id + "amount"}>
          {row.amount} ₺
        </p>
      ),
    },
    { key: "cancelledAt" },
    { key: "cancelledBy" },
    { key: "location" },
    { key: "statusLabel", className: "min-w-32 pr-2" },
  ];
  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "createdBy",
      label: t("Created By"),
      options: users
        .filter((user) => user.active)
        .map((user) => ({
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
      options: users
        .filter((user) => user.active)
        .map((user) => ({
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
      options: users
        .filter((user) => user.active)
        .map((user) => ({
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
      options: users
        .filter((user) => user.active)
        .map((user) => ({
          value: user._id,
          label: user.name,
        })),
      placeholder: t("Cancelled By"),
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
      placeholder: t("Discount"),
      required: true,
    },
    LocationInput({ locations: locations, required: true }),
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
  ];
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
    additionalFilterCleanFunction: () => {
      setFilterPanelFormElements(initialFilterPanelFormElements);
    },
  };
  const filters = [
    {
      isUpperSide: false,
      node: (
        <ButtonFilter
          buttonName={t("Refresh Data")}
          onclick={() => {
            queryClient.invalidateQueries([`${Paths.Order}/query`]);
            queryClient.invalidateQueries([`${Paths.Order}/collection/query`]);
          }}
        />
      ),
    },
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  const actions = [
    {
      name: t("Cancel"),
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCancelOrderModalOpen}
          close={() => setIsCancelOrderModalOpen(false)}
          confirm={() => {
            cancelIkasOrder({
              ikasId: rowToAction.ikasId,
            });
            setIsCancelOrderModalOpen(false);
          }}
          title={t("Cancel Order")}
          text={`Order ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl  ",
      isModal: true,
      isModalOpen: isCancelOrderModalOpen,
      setIsModal: setIsCancelOrderModalOpen,
      isPath: false,
    },
  ];

  useEffect(() => {
    const filteredRows = allRows.filter((row: any) => {
      return (
        passesFilter(filterPanelFormElements.location, row.locationId) &&
        passesFilter(filterPanelFormElements.createdBy, row.createdByUserId) &&
        passesFilter(
          filterPanelFormElements.preparedBy,
          row.preparedByUserId
        ) &&
        passesFilter(
          filterPanelFormElements.deliveredBy,
          row.deliveredByUserId
        ) &&
        passesFilter(
          filterPanelFormElements.cancelledBy,
          row.cancelledByUserId
        ) &&
        passesFilter(filterPanelFormElements.discount, row.discountId) &&
        passesFilter(filterPanelFormElements.status, row.status)
      );
    });
    setRows(filteredRows);
    setTableKey((prev) => prev + 1);
  }, [orders, locations, users, filterPanelFormElements, discounts, items]);
  return (
    <>
      <div className="w-[95%] mx-auto mb-auto ">
        <GenericTable
          key={tableKey}
          title={t("Ikas Orders")}
          columns={columns}
          rowKeys={rowKeys}
          rows={rows}
          isActionsActive={true}
          actions={actions}
          filterPanel={filterPanel}
          filters={filters}
          isExcel={true}
          excelFileName={t("IkasOrders.xlsx")}
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

export default IkasOrders;
