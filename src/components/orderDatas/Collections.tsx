import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { useOrderContext } from "../../context/Order.context";
import { useUserContext } from "../../context/User.context";
import {
    ActionEnum,
    DateRangeKey,
    DisabledConditionEnum,
    OrderCollection,
    OrderCollectionStatus,
    Table,
    commonDateOptions,
} from "../../types";
import { useGetAccountPaymentMethods } from "../../utils/api/account/paymentMethod";
import { dateRanges } from "../../utils/api/dateRanges";
import { Paths } from "../../utils/api/factory";
import { useGetSellLocations } from "../../utils/api/location";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { useGetOrders } from "../../utils/api/order/order";
import {
    useCollectionMutation,
    useGetAllOrderCollections,
} from "../../utils/api/order/orderCollection";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { useGetUsersMinimal } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { passesFilter } from "../../utils/passesFilter";
import Loading from "../common/Loading";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

// Extended type for table rows
type CollectionRow = Omit<OrderCollection, '_id' | 'cancelledAt' | 'paymentMethod'> & {
  _id: number | string; // Override: number -> number | string (for "total" row)
  cashier?: string;
  cancelledBy?: string;
  cancelledById?: string;
  cancelledAt?: string; // Override: Date -> string (formatted)
  date: string;
  formattedDate: string;
  hour: string;
  paymentMethod?: string; // Override: string (id) -> string (name)
  paymentMethodId?: string;
  tableId?: number;
  tableName?: string;
  locationName?: string;
  collapsible?: {
    collapsibleHeader: string;
    collapsibleColumns: { key: string; isSortable: boolean }[];
    collapsibleRows: { product?: string; quantity: number }[];
    collapsibleRowKeys: { key: string }[];
  };
  className?: string;
  isSortable?: boolean;
  breakdown?: {
    paidTotal: number;
    cancelledTotal: number;
    returnedTotal: number;
  };
};

const Collections = () => {
  const { t } = useTranslation();
  const collections = useGetAllOrderCollections();
  const orders = useGetOrders();
  const sellLocations = useGetSellLocations();
  const queryClient = useQueryClient();
  const paymentMethods = useGetAccountPaymentMethods();
  const users = useGetUsersMinimal();
  const items = useGetMenuItems();
  const [rowToAction, setRowToAction] = useState<CollectionRow>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { updateCollection } = useCollectionMutation();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();

  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
    showOrderDataFilters,
    setShowOrderDataFilters,
  } = useOrderContext();

  const collectionsPageDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.ORDERDATAS_COLLECTIONS,
      disabledConditions
    );
  }, [disabledConditions]);

  if (!collections || !orders || !sellLocations || !users || !paymentMethods) {
    return <Loading />;
  }

  const collectionStatus = useMemo(
    () => [
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
    ],
    [t]
  );

  const allRows = useMemo((): CollectionRow[] => {
    return collections
      ?.map((collection): CollectionRow | null => {
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
          formattedDate: formatAsLocalDate(
            format(collectionDate, "yyyy-MM-dd")
          ),
          cancelledAt: collection?.cancelledAt
            ? format(collection?.cancelledAt, "HH:mm")
            : "",
          hour: format(collectionDate, "HH:mm"),
          paymentMethod: paymentMethod ? t(paymentMethod.name) : "",
          paymentMethodId: collection?.paymentMethod,
          tableId: (collection?.table as Table)?._id,
          tableName: (collection?.table as Table)?.name,
          locationName: getItem(collection?.location, sellLocations)?.name,
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
              quantity: orderCollectionItem?.paidQuantity ?? 0,
            })) || [],
            collapsibleRowKeys: [{ key: "product" }, { key: "quantity" }],
          },
        };
      })
      ?.filter((item): item is CollectionRow => item !== null) || [];
  }, [collections, paymentMethods, users, sellLocations, t, orders, items]);

  const rows = useMemo((): CollectionRow[] => {
    const filteredRows = allRows.filter((row) => {
      if (!row?.date) {
        return false;
      }
      if (filterPanelFormElements.hour) {
        return filterPanelFormElements.hour <= row?.hour;
      }
      return (
        passesFilter(filterPanelFormElements.createdBy, row?.createdBy) &&
        passesFilter(filterPanelFormElements.cancelledBy, row?.cancelledById) &&
        passesFilter(filterPanelFormElements.collectionStatus, row?.status) &&
        passesFilter(
          filterPanelFormElements.paymentMethod,
          row?.paymentMethodId
        )
      );
    });

    const paidTotal = filteredRows.reduce(
      (acc, row) =>
        row?.status === OrderCollectionStatus.PAID ? acc + row?.amount : acc,
      0
    );
    const cancelledTotal = filteredRows.reduce(
      (acc, row) =>
        row?.status === OrderCollectionStatus.CANCELLED
          ? acc + row?.amount
          : acc,
      0
    );
    const returnedTotal = filteredRows.reduce(
      (acc, row) =>
        row?.status === OrderCollectionStatus.RETURNED
          ? acc + row?.amount
          : acc,
      0
    );

    const totalRow: CollectionRow = {
      _id: "total",
      location: 0,
      createdAt: new Date(),
      formattedDate: "Total",
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
      status: "",
      cancelledAt: "",
      className: "font-semibold",
      isSortable: false,
      amount: paidTotal + cancelledTotal + returnedTotal,
      breakdown: {
        paidTotal,
        cancelledTotal,
        returnedTotal,
      },
    };
    filteredRows.unshift(totalRow);
    return filteredRows;
  }, [allRows, filterPanelFormElements, t]);

  const editInputs = useMemo(
    () => [
      {
        type: InputTypes.NUMBER,
        formKey: "amount",
        label: t("Amount"),
        placeholder: t("Amount"),
        required: true,
      },
    ],
    [t]
  );

  const editFormKeys = useMemo(
    () => [{ key: "amount", type: FormKeyTypeEnum.NUMBER }],
    []
  );

  const columns = useMemo(
    () => [
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
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "date",
        className: "min-w-32 pr-2 ",
        node: (row: CollectionRow) => {
          return <p className={row?.className}>{row?.formattedDate}</p>;
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
        node: (row: CollectionRow) => {
          // Türkçe format: binlik nokta, ondalık virgül
          const formatAmount = (amount: number) => {
            return amount
              .toFixed(2)
              .replace(".", ",")
              .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
          };

          // Total satırı için özel render
          if (row?._id === "total" && row?.breakdown) {
            const { paidTotal, cancelledTotal, returnedTotal } = row.breakdown;
            return (
              <div className={row?.className}>
                <div className="font-semibold mb-1">
                  {formatAmount(row?.amount ?? 0)} ₺
                </div>
                <div className="text-xs flex flex-wrap gap-1">
                  {paidTotal > 0 && (
                    <span className="bg-blue-50 px-2 py-0.5 rounded">
                      Ödenen: {formatAmount(paidTotal)} ₺
                    </span>
                  )}
                  {cancelledTotal > 0 && (
                    <span className="bg-red-50 px-2 py-0.5 rounded">
                      İptal: {formatAmount(cancelledTotal)} ₺
                    </span>
                  )}
                  {returnedTotal > 0 && (
                    <span className="bg-purple-50 px-2 py-0.5 rounded">
                      İade: {formatAmount(returnedTotal)} ₺
                    </span>
                  )}
                </div>
              </div>
            );
          }

          // Normal satırlar için
          return (
            <p className={row?.className} key={row?._id + "amount"}>
              {formatAmount(row?.amount ?? 0)} ₺
            </p>
          );
        },
      },
      { key: "cancelledBy" },
      { key: "cancelledAt" },
      { key: "cancelNote" },
      {
        key: "status",
        node: (row: CollectionRow) => {
          const status = collectionStatus.find(
            (status) => status.value === row?.status
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
    ],
    [collectionStatus]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "createdBy",
        label: t("Created By"),
        options: users
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
          .map((user) => ({
            value: user._id,
            label: user.name,
          })),
        placeholder: t("Cancelled By"),
        required: true,
      },
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
    ],
    [
      users,
      sellLocations,
      paymentMethods,
      t,
      filterPanelFormElements,
      setFilterPanelFormElements,
    ]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showOrderDataFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      additionalFilterCleanFunction: () => {
        setFilterPanelFormElements(initialFilterPanelFormElements);
      },
      closeFilters: () => setShowOrderDataFilters(false),
    }),
    [
      showOrderDataFilters,
      filterPanelInputs,
      filterPanelFormElements,
      setFilterPanelFormElements,
      initialFilterPanelFormElements,
      setShowOrderDataFilters,
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
              queryClient.invalidateQueries([`${Paths.Order}/query`]);
              queryClient.invalidateQueries([
                `${Paths.Order}/collection/query`,
              ]);
            }}
          />
        ),
        isDisabled: collectionsPageDisabledCondition?.actions?.some(
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
      collectionsPageDisabledCondition,
      user,
      showOrderDataFilters,
      setShowOrderDataFilters,
    ]
  );

  const actions = useMemo(
    () => [
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
              },
            }}
          />
        ) : null,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
        isDisabled: collectionsPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.UPDATE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
    ],
    [
      t,
      rowToAction,
      isEditModalOpen,
      editInputs,
      editFormKeys,
      updateCollection,
      collectionsPageDisabledCondition,
      user,
    ]
  );

  return (
    <>
      <div className="w-[95%] mx-auto mb-auto ">
        <GenericTable
          title={t("Collections")}
          columns={columns}
          rowKeys={rowKeys}
          rows={rows}
          isActionsActive={true}
          actions={actions}
          isCollapsible={true}
          filterPanel={filterPanel}
          filters={filters}
          rowClassNameFunction={(row: CollectionRow) =>
            row?._id !== "total" &&
            row?.status === OrderCollectionStatus.CANCELLED
              ? "bg-red-50"
              : ""
          }
        />
      </div>
    </>
  );
};

export default Collections;
