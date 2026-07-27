import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
} from "react-icons/md";
import { QuickDateRangeFilter } from "../common/QuickDateRangeFilter";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";
import { useOrderContext } from "../../context/Order.context";
import {
  DateRangeKey,
  Order,
  OrderStatus,
  Table,
  commonDateOptions,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetAllLocations } from "../../utils/api/location";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { Paths } from "../../utils/api/factory";
import { useGetPreOrders, usePreOrderMutation } from "../../utils/api/order/order";
import { useGetUsersMinimal } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";

const PreOrders = () => {
  const { t } = useTranslation();
  const orders = useGetPreOrders();
  const locations = useGetAllLocations();
  const users = useGetUsersMinimal();
  const items = useGetMenuItems();
  const queryClient = useQueryClient();
  const { updateSimpleOrder } = usePreOrderMutation();
  const {
    preOrderFilterPanelFormElements,
    setPreOrderFilterPanelFormElements,
    initialPreOrderFilterPanelFormElements,
    showOrderDataFilters,
    setShowOrderDataFilters,
    showUnshippedOnly,
    setShowUnshippedOnly,
  } = useOrderContext();

  const rows = useMemo(() => {
    const filtered = orders?.filter((order) => {
      if (!order || !order?.createdAt) return false;
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
        const shippedCount = groupOrders.filter((o) => o.isShipped).length;
        const allShipped = shippedCount === groupOrders.length;

        if (showUnshippedOnly && allShipped) return null;

        const selectedItemIds = preOrderFilterPanelFormElements.item;
        if (
          Array.isArray(selectedItemIds) &&
          selectedItemIds.length > 0 &&
          !groupOrders.some((o) => selectedItemIds.includes(o.item))
        ) {
          return null;
        }

        return {
          _id: first._id,
          orderIds: groupOrders.map((o) => o._id),
          isReturned: groupOrders.some((o) => o.isReturned),
          date: format(first.createdAt, "yyyy-MM-dd"),
          formattedDate: format(first.createdAt, "dd-MM-yyyy"),
          createdAt: format(first.createdAt, "HH:mm") ?? "",
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
          shippedSummary: `${shippedCount}/${groupOrders.length}`,
          isFullyShipped: allShipped,
          collapsible: {
            collapsibleHeader: t("Products"),
            collapsibleColumns: [
              { key: t("Product"), isSortable: false },
              { key: t("Quantity"), isSortable: false },
              { key: t("Amount"), isSortable: false },
              { key: t("Shipped"), isSortable: false, className: "text-center" },
            ],
            collapsibleRows: groupOrders.map((order) => ({
              _id: order._id,
              item: getItem(order?.item, items)?.name ?? "",
              quantity: order?.quantity ?? "",
              amount: order?.unitPrice * order?.quantity,
              isShipped: order?.isShipped ?? false,
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
                key: "isShipped",
                node: (row: any) => {
                  const CheckboxComponent = row?.isShipped
                    ? MdOutlineCheckBox
                    : MdOutlineCheckBoxOutlineBlank;
                  return (
                    <div className="flex justify-center">
                      <CheckboxComponent
                        key={row._id + "shipped-checkbox"}
                        className="text-2xl cursor-pointer hover:scale-105"
                        onClick={() =>
                          updateSimpleOrder({
                            id: row._id,
                            updates: {
                              isShipped: !row.isShipped,
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
      .filter(Boolean)
      .sort((a: any, b: any) =>
        a.isFullyShipped === b.isFullyShipped ? 0 : a.isFullyShipped ? 1 : -1
      );
  }, [
    orders,
    showUnshippedOnly,
    preOrderFilterPanelFormElements.item,
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
      { key: t("Email"), isSortable: true, correspondingKey: "customerEmail" },
      { key: t("Phone"), isSortable: true, correspondingKey: "customerPhone" },
      { key: t("Amount"), isSortable: true, correspondingKey: "amount" },
      { key: t("Location"), isSortable: true, correspondingKey: "location" },
      { key: t("Shipped"), isSortable: false, className: "text-center" },
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
      {
        key: "shippedSummary",
        node: (row: any) => (
          <p className="text-center">{row.shippedSummary}</p>
        ),
      },
    ],
    []
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "item",
        label: t("Menu Item"),
        options: items?.map((item) => ({
          value: item?._id,
          label: item?.name,
        })),
        placeholder: t("Menu Item"),
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
        }: {
          value: string;
          label: string;
        }) => {
          const dateRange = dateRanges[value as DateRangeKey];
          if (dateRange) {
            setPreOrderFilterPanelFormElements({
              ...preOrderFilterPanelFormElements,
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
        formKey: "createdBy",
        label: t("Created By"),
        options: users?.map((user) => ({
          value: user._id,
          label: user.name,
        })),
        placeholder: t("Created By"),
        required: true,
      },
    ],
    [
      items,
      t,
      preOrderFilterPanelFormElements,
      setPreOrderFilterPanelFormElements,
      users,
    ]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showOrderDataFilters,
      inputs: filterPanelInputs,
      formElements: preOrderFilterPanelFormElements,
      setFormElements: setPreOrderFilterPanelFormElements,
      closeFilters: () => setShowOrderDataFilters(false),
      additionalFilterCleanFunction: () => {
        setPreOrderFilterPanelFormElements(
          initialPreOrderFilterPanelFormElements
        );
      },
    }),
    [
      showOrderDataFilters,
      filterPanelInputs,
      preOrderFilterPanelFormElements,
      setPreOrderFilterPanelFormElements,
      setShowOrderDataFilters,
      initialPreOrderFilterPanelFormElements,
    ]
  );

  const filters = useMemo(
    () => [
      {
        isUpperSide: true,
        node: (
          <QuickDateRangeFilter
            startDate={preOrderFilterPanelFormElements.after}
            endDate={preOrderFilterPanelFormElements.before}
            onChange={(start: string, end: string) => {
              const isReset = !start && !end;
              setPreOrderFilterPanelFormElements({
                ...preOrderFilterPanelFormElements,
                after: isReset
                  ? initialPreOrderFilterPanelFormElements.after
                  : start,
                before: isReset ? "" : end,
                date: "",
              });
            }}
          />
        ),
      },
      {
        isUpperSide: false,
        node: (
          <ButtonFilter
            buttonName={t("Refresh Data")}
            onclick={() => {
              queryClient.invalidateQueries({
                queryKey: [`${Paths.Order}/pre-order/query`],
              });
            }}
          />
        ),
      },
      {
        label: t("Show Unshipped Only"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showUnshippedOnly}
            onChange={() => {
              setShowUnshippedOnly(!showUnshippedOnly);
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
    ],
    [
      t,
      queryClient,
      showUnshippedOnly,
      setShowUnshippedOnly,
      showOrderDataFilters,
      setShowOrderDataFilters,
      preOrderFilterPanelFormElements,
      setPreOrderFilterPanelFormElements,
      initialPreOrderFilterPanelFormElements,
    ]
  );

  return (
    <div className="w-[95%] mx-auto mb-auto ">
      <GenericTable
        title={t("Shopify Pre Orders")}
        columns={columns}
        rowKeys={rowKeys as any}
        rows={rows as any}
        isActionsActive={false}
        filterPanel={filterPanel}
        filters={filters}
        isCollapsible={true}
        rowClassNameFunction={(row: any) => {
          if (row?.isReturned) {
            return "bg-red-200";
          }
          return row?.isFullyShipped ? "bg-green-50" : "bg-red-50";
        }}
      />
    </div>
  );
};

export default PreOrders;
