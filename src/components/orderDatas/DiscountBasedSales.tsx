import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { useOrderContext } from "../../context/Order.context";
import {
  DateRangeKey,
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
import { useGetOrders } from "../../utils/api/order/order";
import { useGetOrderDiscounts } from "../../utils/api/order/orderDiscount";
import { useGetTables } from "../../utils/api/table";
import { useGetUsers } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import { LocationInput } from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import OrderPaymentModal from "../orders/orderPayment/OrderPaymentModal";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

type ItemQuantity = {
  itemId: number;
  itemName: string;
  quantity: number;
  tables: Partial<Table[]>;
};
type OrderWithPaymentInfo = {
  item: number;
  itemName: string;
  paidQuantity: number;
  discountId: number;
  discountName: string;
  amount: number;
  location: number;
  date: string;
  totalAmountWithDiscount: number;
  itemQuantity: ItemQuantity[];
  collapsible: any;
  className?: string;
  isSortable?: boolean;
};
const DiscountBasedSales = () => {
  const { t } = useTranslation();
  const discounts = useGetOrderDiscounts();
  const orders = useGetOrders();
  const sellLocations = useGetSellLocations();
  const queryClient = useQueryClient();
  const items = useGetMenuItems();
  const users = useGetUsers();
  const categories = useGetAllCategories();
  const { setExpandedRows } = useGeneralContext();
  const { resetOrderContext } = useOrderContext();
  const [selectedTableId, setSelectedTableId] = useState<number>(0);
  const [isOrderPaymentModalOpen, setIsOrderPaymentModalOpen] = useState(false);
  const tables = useGetTables();
  if (!orders || !sellLocations || !discounts || !items || !tables) {
    return null;
  }
  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
    showOrderDataFilters,
    setShowOrderDataFilters,
  } = useOrderContext();
  const [tableKey, setTableKey] = useState(0);
  const allRows = orders
    ?.filter(
      (order) => ![OrderStatus.CANCELLED].includes(order.status as OrderStatus)
    )
    ?.reduce((acc, order) => {
      if (!order?.discount || order?.paidQuantity === 0) {
        return acc;
      }
      // Date filters
      const zonedTime = toZonedTime(order.createdAt, "UTC");
      const orderDate = new Date(zonedTime);
      if (!passesFilter(filterPanelFormElements.discount, order?.discount)) {
        return acc;
      }
      const existingEntry = acc.find(
        (item) => item.discountId === order?.discount
      );
      if (existingEntry) {
        existingEntry.paidQuantity +=
          order?.status !== OrderStatus.RETURNED
            ? order?.paidQuantity
            : -order?.quantity;
        existingEntry.amount += order?.paidQuantity * order?.unitPrice;
        existingEntry.totalAmountWithDiscount =
          existingEntry.totalAmountWithDiscount +
          order?.paidQuantity * order?.unitPrice -
          (order?.discountPercentage
            ? (order?.discountPercentage ?? 0) *
              order?.paidQuantity *
              order?.unitPrice *
              (1 / 100)
            : (order?.discountAmount ?? 0) * order?.paidQuantity);
        const existingItem = existingEntry.itemQuantity.find(
          (itemQuantityIteration) =>
            itemQuantityIteration.itemId === order?.item
        );
        if (existingItem) {
          existingEntry.itemQuantity = existingEntry.itemQuantity.map(
            (itemQuantityIteration) =>
              itemQuantityIteration.itemId === existingItem.itemId
                ? {
                    ...itemQuantityIteration,
                    quantity:
                      itemQuantityIteration.quantity +
                      (order?.status !== OrderStatus.RETURNED
                        ? order?.paidQuantity
                        : -order?.quantity),
                    tables: Array.from(
                      new Map(
                        [...itemQuantityIteration.tables, order?.table].map(
                          (table) => [(table as Table)?._id, table]
                        )
                      ).values()
                    ) as any,
                  }
                : itemQuantityIteration
          );
          existingEntry.itemQuantity;
        } else {
          existingEntry.itemQuantity.push({
            itemId: order?.item,
            itemName: getItem(order?.item, items)?.name ?? "",
            quantity:
              order?.status !== OrderStatus.RETURNED
                ? order?.paidQuantity
                : -order?.quantity,
            tables: [order?.table as Table],
          });
        }
        existingEntry.collapsible = {
          collapsibleHeader: t("Products"),
          collapsibleColumns: [
            { key: t("Product"), isSortable: true },
            { key: t("Quantity"), isSortable: true },
            { key: t("Tables"), isSortable: false },
          ],
          collapsibleRows: existingEntry.itemQuantity
            .map((itemQuantityIteration) => ({
              product: itemQuantityIteration.itemName,
              quantity: itemQuantityIteration.quantity,
              tables: itemQuantityIteration.tables,
            }))
            .sort((a, b) => b.quantity - a.quantity),
          collapsibleRowKeys: [
            { key: "product" },
            { key: "quantity" },
            {
              key: "tables",
              node: (row: any) => {
                return (
                  <div className="flex flex-row gap-3 flex-wrap   ">
                    {row?.tables?.map((table: Table) => (
                      <p
                        key={table?._id}
                        className="text-blue-700 w-fit cursor-pointer hover:text-blue-500 transition-transform "
                        onClick={() => {
                          setSelectedTableId(table?._id);
                          setIsOrderPaymentModalOpen(true);
                        }}
                      >
                        {table?._id}
                      </p>
                    ))}
                  </div>
                );
              },
            },
          ],
        };
      } else {
        acc.push({
          item: order?.item,
          itemName: getItem(order?.item, items)?.name ?? "",
          paidQuantity:
            order?.status !== OrderStatus.RETURNED
              ? order?.paidQuantity
              : -order?.quantity,
          discountId: order?.discount,
          discountName:
            discounts?.find((discount) => discount._id === order?.discount)
              ?.name ?? "",
          amount: order?.paidQuantity * order?.unitPrice,
          location: order?.location,
          date: format(orderDate, "yyyy-MM-dd"),
          itemQuantity: [
            {
              itemId: order?.item,
              itemName: getItem(order?.item, items)?.name ?? "",
              quantity:
                order?.status !== OrderStatus.RETURNED
                  ? order?.paidQuantity
                  : -order?.quantity,
              tables: [order?.table as Table],
            },
          ],
          collapsible: {
            collapsibleHeader: t("Products"),
            collapsibleColumns: [
              { key: t("Unit Price"), isSortable: true },
              { key: t("Quantity"), isSortable: true },
            ],
            collapsibleRows: [
              {
                product: getItem(order?.item, items)?.name,
                quantity:
                  order?.status !== OrderStatus.RETURNED
                    ? order?.paidQuantity
                    : -order?.quantity,
                tables: [order.table],
              },
            ],
            collapsibleRowKeys: [
              { key: "product" },
              { key: "quantity" },
              {
                key: "tables",
                node: (row: any) => {
                  return (
                    <div className="flex flex-row border-4 ">
                      {row?.tables?.map((table: Table) => (
                        <p
                          key={table?._id}
                          className="text-blue-700 w-fit cursor-pointer hover:text-blue-500 transition-transform"
                          onClick={() => {
                            setSelectedTableId(table?._id);
                            setIsOrderPaymentModalOpen(true);
                          }}
                        >
                          {table?._id}
                        </p>
                      ))}
                    </div>
                  );
                },
              },
            ],
          },
          totalAmountWithDiscount:
            order?.paidQuantity * order?.unitPrice -
            (order?.discountPercentage
              ? (order?.discountPercentage ?? 0) *
                order?.paidQuantity *
                order?.unitPrice *
                (1 / 100)
              : (order?.discountAmount ?? 0) * order?.paidQuantity),
        });
      }
      return acc;
    }, [] as OrderWithPaymentInfo[]);
  if (allRows.length > 0) {
    allRows.sort((a, b) => b.paidQuantity - a.paidQuantity);
    allRows.push({
      item: 0,
      itemName: "",
      paidQuantity: allRows.reduce((acc, item) => acc + item.paidQuantity, 0),
      className: "font-semibold",
      discountId: 0,
      discountName: t("Total"),
      isSortable: false,
      amount: allRows.reduce((acc, item) => acc + item.amount, 0),
      totalAmountWithDiscount: allRows.reduce(
        (acc, item) => acc + item.totalAmountWithDiscount,
        0
      ),
      location: 4,
      date: "",
      itemQuantity: [],
      collapsible: {
        collapsibleHeader: t("Products"),
        collapsibleColumns: [
          { key: t("Product"), isSortable: true },
          { key: t("Quantity"), isSortable: true },
        ],
        collapsibleRows: [],
        collapsibleRowKeys: [{ key: "product" }, { key: "quantity" }],
      },
    });
  }
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Discount"), isSortable: true },
    { key: t("Quantity"), isSortable: true },
  ];
  const rowKeys = [
    {
      key: "discountName",
      node: (row: any) => {
        return <p className={`${row?.className}`}>{row?.discountName}</p>;
      },
    },
    {
      key: "paidQuantity",
      node: (row: any) => {
        return <p className={`${row?.className}  `}>{row?.paidQuantity}</p>;
      },
    },
  ];
  const filterPanelInputs = [
    LocationInput({
      locations: sellLocations,
      required: true,
      isMultiple: true,
    }),
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
    isFilterPanelActive: showOrderDataFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowOrderDataFilters(false),
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
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [
    orders,
    filterPanelFormElements,
    discounts,
    items,
    sellLocations,
    tables,
    users,
    categories,
  ]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          filters={filters}
          filterPanel={filterPanel}
          title={t("Discount Based Sales")}
          isActionsActive={false}
          isCollapsible={true}
        />
        {isOrderPaymentModalOpen && selectedTableId && (
          <OrderPaymentModal
            tableId={selectedTableId}
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

export default DiscountBasedSales;
