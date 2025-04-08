import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { useOrderContext } from "../../context/Order.context";
import {
  DateRangeKey,
  OrderCollectionStatus,
  Table,
  commonDateOptions,
} from "../../types";
import { useGetAccountPaymentMethods } from "../../utils/api/account/paymentMethod";
import { dateRanges } from "../../utils/api/dateRanges";
import { Paths } from "../../utils/api/factory";
import { useGetAllLocations } from "../../utils/api/location";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { useGetOrders } from "../../utils/api/order/order";
import {
  useCollectionMutation,
  useGetAllOrderCollections,
} from "../../utils/api/order/orderCollection";
import { useGetUsers } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { LocationInput } from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const Collections = () => {
  const { t } = useTranslation();
  const collections = useGetAllOrderCollections();
  const orders = useGetOrders();
  const locations = useGetAllLocations();
  const queryClient = useQueryClient();
  const paymentMethods = useGetAccountPaymentMethods();
  const users = useGetUsers();
  const items = useGetMenuItems();
  const [tableKey, setTableKey] = useState(0);
  const [rowToAction, setRowToAction] = useState<any>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { updateCollection } = useCollectionMutation();
  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
    showOrderDataFilters,
    setShowOrderDataFilters,
  } = useOrderContext();
  if (!collections || !orders || !locations || !users || !paymentMethods) {
    return null;
  }
  const collectionStatus = [
    {
      value: OrderCollectionStatus.CANCELLED,
      label: t("Cancelled Status"),
      bgColor: "bg-red-500",
    },
    {
      value: OrderCollectionStatus.RETURNED,
      label: t("Returned"),
      bgColor: "bg-purple-500",
    },
    {
      value: OrderCollectionStatus.PAID,
      label: t("Paid Status"),
      bgColor: "bg-blue-500",
    },
  ];
  const allRows = collections
    ?.map((collection) => {
      if (!collection?.createdAt) {
        return null;
      }
      const paymentMethod = paymentMethods.find(
        (method) => method._id === collection?.paymentMethod
      );
      const zonedTime = toZonedTime(collection.createdAt, "UTC");
      const collectionDate = new Date(zonedTime);
      return {
        ...collection,
        cashier: getItem(collection?.createdBy, users)?.name,
        cancelledBy: getItem(collection?.cancelledBy, users)?.name,
        cancelledById: collection?.cancelledBy,
        date: format(collectionDate, "yyyy-MM-dd"),
        formattedDate: formatAsLocalDate(format(collectionDate, "yyyy-MM-dd")),
        cancelledAt: collection?.cancelledAt
          ? format(collection?.cancelledAt, "HH:mm")
          : "",
        hour: format(collectionDate, "HH:mm"),
        paymentMethod: paymentMethod ? t(paymentMethod.name) : "",
        paymentMethodId: collection?.paymentMethod,
        tableId: (collection?.table as Table)?._id,
        tableName: (collection?.table as Table)?.name,
        locationName: getItem(collection?.location, locations)?.name,
        collapsible: {
          collapsibleHeader: t("Orders"),
          collapsibleColumns: [
            { key: t("Product"), isSortable: true },
            { key: t("Quantity"), isSortable: true },
          ],
          collapsibleRows: collection?.orders?.map((orderCollectionItem) => ({
            product: getItem(
              orders?.find((order) => order._id === orderCollectionItem.order)
                ?.item,
              items
            )?.name,
            quantity: orderCollectionItem.paidQuantity.toFixed(2),
          })),
          collapsibleRowKeys: [{ key: "product" }, { key: "quantity" }],
        },
      };
    })
    ?.filter((item) => item !== null);
  const [rows, setRows] = useState(allRows);
  const editInputs = [
    {
      type: InputTypes.NUMBER,
      formKey: "amount",
      label: t("Amount"),
      placeholder: t("Amount"),
      required: true,
    },
    // {
    //   type: InputTypes.SELECT,
    //   formKey: "status",
    //   label: t("Status"),
    //   options: collectionStatus.map((option) => {
    //     return {
    //       value: option.value,
    //       label: t(option.label),
    //     };
    //   }),
    //   placeholder: t("Status"),
    //   required: true,
    // },
  ];
  const editFormKeys = [
    { key: "amount", type: FormKeyTypeEnum.NUMBER },
    // { key: "status", type: FormKeyTypeEnum.STRING },
  ];
  const columns = [
    { key: t("Date"), isSortable: true },
    { key: t("Table Id"), isSortable: true },
    { key: t("Table Name"), isSortable: true },
    { key: t("Create Hour"), isSortable: true },
    { key: t("Location"), isSortable: true },
    { key: t("Created By"), isSortable: true },
    { key: t("Payment Method"), isSortable: true },
    { key: t("Amount"), isSortable: true },
    { key: t("Cancelled By"), isSortable: true },
    { key: t("Cancelled At"), isSortable: true },
    { key: t("Cancel Note"), isSortable: true },
    { key: t("Status"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [
    {
      key: "date",
      className: "min-w-32 pr-2 ",
      node: (row: any) => {
        return <p className={row?.className}>{row.formattedDate}</p>;
      },
    },
    { key: "tableId" },
    { key: "tableName", className: "min-w-40 pr-2" },
    { key: "hour" },
    { key: "locationName", className: "min-w-32 pr-2 " },
    { key: "cashier" },
    { key: "paymentMethod" },
    {
      key: "amount",
      node: (row: any) => (
        <p className={row?.className} key={row._id + "amount"}>
          {row.amount.toFixed(2)} ₺
        </p>
      ),
    },
    { key: "cancelledBy" },
    { key: "cancelledAt" },
    { key: "cancelNote" },
    {
      key: "status",
      node: (row: any) => {
        const status = collectionStatus.find(
          (status) => status.value === row.status
        );
        if (!status) {
          return null;
        }
        return (
          <p
            className={`text-white p-0.5 text-sm rounded-md text-center font-semibold ${status.bgColor}`}
          >
            {status.label}
          </p>
        );
      },
    },
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
    LocationInput({ locations: locations, required: true, isMultiple: true }),
    {
      type: InputTypes.SELECT,
      formKey: "paymentMethod",
      label: t("Payment Method"),
      options: paymentMethods.map((paymentMethod) => ({
        value: paymentMethod._id,
        label: t(paymentMethod.name),
      })),
      placeholder: t("Payment Method"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "collectionStatus",
      label: t("Status"),
      options: [
        { value: OrderCollectionStatus.PAID, label: t("Paid") },
        { value: OrderCollectionStatus.RETURNED, label: t("Returned") },
        { value: OrderCollectionStatus.CANCELLED, label: t("Cancelled") },
      ],
      placeholder: t("Status"),
      required: true,
    },
    {
      type: InputTypes.HOUR,
      formKey: "hour",
      label: t("Hour"),
      required: false,
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
  ];
  const filterPanel = {
    isFilterPanelActive: showOrderDataFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    additionalFilterCleanFunction: () => {
      setFilterPanelFormElements(initialFilterPanelFormElements);
    },
    closeFilters: () => setShowOrderDataFilters(false),
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
      node: (
        <SwitchButton
          checked={showOrderDataFilters}
          onChange={() => {
            setShowOrderDataFilters(!showOrderDataFilters);
          }}
        />
      ),
    },
  ];
  const actions = [
    {
      name: t("Edit"),
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl ",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={editInputs}
          formKeys={editFormKeys}
          submitItem={updateCollection as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          generalClassName="overflow-visible"
          itemToEdit={{
            id: rowToAction?._id,
            updates: {
              amount: rowToAction?.amount,
              // status: rowToAction?.status,
            },
          }}
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
    },
  ];
  useEffect(() => {
    const filteredRows = allRows.filter((row) => {
      if (!row?.date) {
        return false;
      }
      if (filterPanelFormElements.hour) {
        return filterPanelFormElements.hour >= row.hour;
      }
      return (
        passesFilter(filterPanelFormElements.createdBy, row.createdBy) &&
        passesFilter(filterPanelFormElements.cancelledBy, row.cancelledById) &&
        passesFilter(filterPanelFormElements.collectionStatus, row.status) &&
        passesFilter(filterPanelFormElements.paymentMethod, row.paymentMethodId)
      );
    });
    const totalRow = {
      _id: "total",
      formattedDate: "Total",
      tableId: "",
      tableName: "",
      locationName: "",
      date: "",
      hour: "",
      cashier: "",
      paymentMethod: "",
      createdBy: "",
      cancelledBy: "",
      cancelledById: "",
      cancelNote: "",
      collectionStatus: "",
      cancelledAt: "",
      className: "font-semibold",
      isSortable: false,
      amount: filteredRows?.reduce((acc, row: any) => acc + row.amount, 0),
      collapsible: {
        collapsibleHeader: t("Total Summary"),
        collapsibleColumns: [
          { key: t("Total Amount"), isSortable: false },
          { key: t("Quantity"), isSortable: false },
        ],
        collapsibleRows: [],
        collapsibleRowKeys: [{ key: "totalAmount" }, { key: "totalQuantity" }],
      },
    };
    filteredRows.push(totalRow as any);
    setRows(filteredRows);
    setTableKey((prev) => prev + 1);
  }, [
    collections,
    orders,
    locations,
    users,
    filterPanelFormElements,
    paymentMethods,
    items,
  ]);

  return (
    <>
      <div className="w-[95%] mx-auto mb-auto ">
        <GenericTable
          key={tableKey}
          title={t("Collections")}
          columns={columns}
          rowKeys={rowKeys}
          rows={rows}
          isActionsActive={true}
          actions={actions}
          isCollapsible={true}
          filterPanel={filterPanel}
          filters={filters}
        />
      </div>
    </>
  );
};

export default Collections;
