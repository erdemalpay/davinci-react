import { useQueryClient } from "@tanstack/react-query";
import { differenceInMinutes, format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PiArrowArcLeftBold } from "react-icons/pi";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { useOrderContext } from "../../context/Order.context";
import {
  commonDateOptions,
  DateRangeKey,
  orderFilterStatusOptions,
  Table,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { Paths } from "../../utils/api/factory";
import { useGetAllLocations } from "../../utils/api/location";
import { useGetCategories } from "../../utils/api/menu/category";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import {
  useGetOrders,
  useReturnOrdersMutation,
} from "../../utils/api/order/order";
import { useGetOrderDiscounts } from "../../utils/api/order/orderDiscount";
import { useGetTables } from "../../utils/api/table";
import { useGetUsers } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import { LocationInput } from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import OrderPaymentModal from "../orders/orderPayment/OrderPaymentModal";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";

const OrdersReport = () => {
  const { t } = useTranslation();
  const orders = useGetOrders();
  const locations = useGetAllLocations();
  const queryClient = useQueryClient();
  const users = useGetUsers();
  const categories = useGetCategories();
  const [showFilters, setShowFilters] = useState(false);
  const [rowToAction, setRowToAction] = useState<any>({});
  const discounts = useGetOrderDiscounts();
  const [isOrderPaymentModalOpen, setIsOrderPaymentModalOpen] = useState(false);
  const { setExpandedRows } = useGeneralContext();
  const { resetOrderContext } = useOrderContext();
  const tables = useGetTables();
  const items = useGetMenuItems();
  const [tableKey, setTableKey] = useState(0);
  const [isReturnOrderModalOpen, setIsReturnOrderModalOpen] = useState(false);
  const { mutate: returnOrder } = useReturnOrdersMutation();
  const [returnOrderForm, setReturnOrderForm] = useState<any>({
    quantity: 0,
  });
  const returnOrderInputs = [
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
  ];
  const returnOrderFormElements = [
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
  } = useOrderContext();
  if (!orders || !locations || !users || !discounts) {
    return null;
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
        statusLabel: orderFilterStatusOptions.find(
          (status) => status.value === order?.status
        )?.label,
      };
    })
    ?.filter((item) => item !== null);
  const [rows, setRows] = useState(allRows);
  const columns = [
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
    { key: t("Prepared By"), isSortable: true, correspondingKey: "preparedBy" },
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
  ];
  const filterPanelInputs = [
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
    const totalRow = {
      _id: "total",
      className: "font-semibold",
      isSortable: false,
      quantity: filteredRows?.reduce((acc, row: any) => acc + row.quantity, 0),
      amount: filteredRows?.reduce((acc, row: any) => acc + row.amount, 0),
      discountAmount: filteredRows?.reduce(
        (acc, row: any) => acc + row.discountAmount,
        0
      ),
      formattedDate: "Total",
    };
    filteredRows?.push(totalRow as any);
    setRows(filteredRows);
    setTableKey((prev) => prev + 1);
  }, [
    orders,
    locations,
    users,
    filterPanelFormElements,
    discounts,
    items,
    categories,
  ]);
  return (
    <>
      <div className="w-[95%] mx-auto mb-auto ">
        <GenericTable
          key={tableKey}
          title={t("Cafe Orders")}
          columns={columns}
          rowKeys={rowKeys}
          rows={rows}
          isActionsActive={true}
          actions={actions}
          filterPanel={filterPanel}
          filters={filters}
          isExcel={true}
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
