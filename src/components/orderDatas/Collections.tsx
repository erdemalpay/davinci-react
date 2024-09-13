import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../context/Order.context";
import {
  Location,
  MenuItem,
  OrderCollectionStatus,
  Table,
  User,
} from "../../types";
import { useGetAccountPaymentMethods } from "../../utils/api/account/paymentMethod";
import { useGetLocations } from "../../utils/api/location";
import { useGetOrders } from "../../utils/api/order/order";
import { useGetAllOrderCollections } from "../../utils/api/order/orderCollection";
import { useGetUsers } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { LocationInput } from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

const Collections = () => {
  const { t } = useTranslation();
  const collections = useGetAllOrderCollections();
  const orders = useGetOrders();
  const locations = useGetLocations();
  const paymentMethods = useGetAccountPaymentMethods();
  const users = useGetUsers();
  const [tableKey, setTableKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const { filterPanelFormElements, setFilterPanelFormElements } =
    useOrderContext();
  if (!collections || !orders || !locations || !users || !paymentMethods) {
    return null;
  }
  const allRows = collections
    .map((collection) => {
      if (!collection?.createdAt) {
        return null;
      }
      const paymentMethod = paymentMethods.find(
        (method) => method._id === collection.paymentMethod
      );
      return {
        _id: collection._id,
        cashier: (collection.createdBy as User)?.name,
        createdBy: (collection.createdBy as User)?._id,
        orders: collection.orders,
        cancelledBy: (collection?.cancelledBy as User)?.name,
        cancelledById: (collection?.cancelledBy as User)?._id,
        date: format(collection.createdAt, "yyyy-MM-dd"),
        formattedDate: formatAsLocalDate(
          format(collection.createdAt, "yyyy-MM-dd")
        ),
        cancelledAt: collection?.cancelledAt
          ? format(collection.cancelledAt, "HH:mm")
          : "",
        hour: format(collection.createdAt, "HH:mm"),
        paymentMethod: paymentMethod ? t(paymentMethod.name) : "",
        paymentMethodId: collection.paymentMethod,
        tableId: (collection.table as Table)._id,
        tableName: (collection.table as Table).name,
        amount: collection.amount.toFixed(2),
        cancelNote: collection.cancelNote ?? "",
        location: (collection.location as Location)._id,
        locationName: (collection.location as Location).name,
        status: collection.status,
        collapsible: {
          collapsibleHeader: t("Orders"),
          collapsibleColumns: [
            { key: t("Product"), isSortable: true },
            { key: t("Quantity"), isSortable: true },
          ],
          collapsibleRows: collection?.orders?.map((orderCollectionItem) => ({
            product: (
              orders?.find((order) => order._id === orderCollectionItem.order)
                ?.item as MenuItem
            )?.name,
            quantity: orderCollectionItem.paidQuantity.toFixed(2),
          })),
          collapsibleRowKeys: [{ key: "product" }, { key: "quantity" }],
        },
      };
    })
    .filter((item) => item !== null);
  const [rows, setRows] = useState(allRows);
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
  ];
  const rowKeys = [
    {
      key: "date",
      className: "min-w-32 pr-2 ",
      node: (row: any) => {
        return <p className={`${row?.className}`}>{row.formattedDate}</p>;
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
      node: (row: any) => <p key={row._id + "amount"}>{row.amount} ₺</p>,
    },
    { key: "cancelledBy" },
    { key: "cancelledAt" },
    { key: "cancelNote" },
    {
      key: "status",
      node: (row: any) =>
        row.status === OrderCollectionStatus.PAID ? (
          <p className="text-white bg-blue-500 p-0.5 text-sm rounded-md text-center font-semibold">
            {t("Paid Status")}
          </p>
        ) : (
          <p className="text-white bg-red-500 p-0.5 text-sm rounded-md text-center font-semibold">
            {t("Cancelled Status")}
          </p>
        ),
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
    LocationInput({ locations: locations, required: true }),
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
      formKey: "status",
      label: t("Status"),
      options: [
        { value: OrderCollectionStatus.PAID, label: t("Paid") },
        { value: OrderCollectionStatus.CANCELLED, label: t("Cancelled") },
      ],
      placeholder: t("Status"),
      required: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "after",
      label: t("Start Date"),
      placeholder: t("Start Date"),
      required: true,
      isDatePicker: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "before",
      label: t("End Date"),
      placeholder: t("End Date"),
      required: true,
      isDatePicker: true,
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
  };
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  useEffect(() => {
    const filteredRows = allRows.filter((row) => {
      if (!row?.date) {
        return false;
      }
      return (
        (filterPanelFormElements.before === "" ||
          row.date <= filterPanelFormElements.before) &&
        (filterPanelFormElements.after === "" ||
          row.date >= filterPanelFormElements.after) &&
        passesFilter(filterPanelFormElements.location, row.location) &&
        passesFilter(filterPanelFormElements.createdBy, row.createdBy) &&
        passesFilter(filterPanelFormElements.cancelledBy, row.cancelledById) &&
        passesFilter(filterPanelFormElements.status, row.status) &&
        passesFilter(filterPanelFormElements.paymentMethod, row.paymentMethodId)
      );
    });
    setRows(filteredRows);
    setTableKey((prev) => prev + 1);
  }, [
    collections,
    orders,
    locations,
    users,
    filterPanelFormElements,
    paymentMethods,
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
          isActionsActive={false}
          isCollapsible={true}
          filterPanel={filterPanel}
          filters={filters}
        />
      </div>
    </>
  );
};

export default Collections;
