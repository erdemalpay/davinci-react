import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import {
  AccountPaymentMethod,
  Location,
  MenuItem,
  OrderCollectionStatus,
  User,
} from "../../types";
import { useGetLocations } from "../../utils/api/location";
import { useGetOrders } from "../../utils/api/order/order";
import { useGetAllOrderCollections } from "../../utils/api/order/orderCollection";
import { useGetUsers } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { LocationInput } from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";

type FormElementsState = {
  [key: string]: any;
};
const Collections = () => {
  const { t } = useTranslation();
  const collections = useGetAllOrderCollections();
  const orders = useGetOrders();
  const locations = useGetLocations();
  const users = useGetUsers();
  const [tableKey, setTableKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      location: "",
      user: "",
      status: "",
      before: "",
      after: "",
    });
  if (!collections || !orders || !locations || !users) {
    return null;
  }

  const allRows = collections
    .map((collection) => {
      return {
        _id: collection._id,
        orderPayment: collection.orderPayment,
        cashier: (collection.createdBy as User)?.name,
        createdBy: (collection.createdBy as User)?._id,
        orders: collection.orders,
        cancelledBy: (collection?.cancelledBy as User)?.name,
        date: format(collection.createdAt, "yyyy-MM-dd"),
        formattedDate: formatAsLocalDate(
          format(collection.createdAt, "yyyy-MM-dd")
        ),
        cancelledAt: collection?.cancelledAt
          ? format(collection.cancelledAt, "HH:mm")
          : "",
        hour: format(collection.createdAt, "HH:mm"),
        paymentMethod: t(
          (collection.paymentMethod as AccountPaymentMethod)?.name
        ),
        amount: collection.amount,
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
            quantity: orderCollectionItem.paidQuantity,
          })),
          collapsibleRowKeys: [{ key: "product" }, { key: "quantity" }],
        },
      };
    })
    .filter((item) => item !== null);
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Date"), isSortable: true },
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
          <IoCheckmark className={`text-blue-500 text-2xl `} />
        ) : (
          <IoCloseOutline className={`text-red-800 text-2xl `} />
        ),
    },
  ];
  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "user",
      label: t("User"),
      options: users
        .filter((user) => user.active)
        .map((user) => ({
          value: user._id,
          label: user.name,
        })),
      placeholder: t("User"),
      required: true,
    },
    LocationInput({ locations: locations, required: true }),
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
      return (
        (filterPanelFormElements.before === "" ||
          row.date <= filterPanelFormElements.before) &&
        (filterPanelFormElements.after === "" ||
          row.date >= filterPanelFormElements.after) &&
        passesFilter(filterPanelFormElements.location, row.location) &&
        passesFilter(filterPanelFormElements.user, row.createdBy) &&
        passesFilter(filterPanelFormElements.status, row.status)
      );
    });
    setRows(filteredRows);
    setTableKey((prev) => prev + 1);
  }, [collections, orders, locations, users, filterPanelFormElements]);

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
