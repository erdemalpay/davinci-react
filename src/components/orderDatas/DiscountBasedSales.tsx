import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../context/Order.context";
import {
  commonDateOptions,
  DateRangeKey,
  OrderStatus,
  Table,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetLocations } from "../../utils/api/location";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { useGetOrders } from "../../utils/api/order/order";
import { useGetOrderDiscounts } from "../../utils/api/order/orderDiscount";
import { getItem } from "../../utils/getItem";
import { LocationInput } from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";
type ItemQuantity = {
  itemId: number;
  itemName: string;
  quantity: number;
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
  const locations = useGetLocations();
  const items = useGetMenuItems();
  const [showFilters, setShowFilters] = useState(false);
  if (!orders || !locations || !discounts || !items) {
    return null;
  }
  const { filterPanelFormElements, setFilterPanelFormElements } =
    useOrderContext();
  const [tableKey, setTableKey] = useState(0);
  const allRows = orders
    ?.filter((order) => order.status !== OrderStatus.CANCELLED)
    ?.reduce((acc, order) => {
      if (!order?.discount || order?.paidQuantity === 0) {
        return acc;
      }

      // Location filter
      if (
        filterPanelFormElements.location !== "" &&
        filterPanelFormElements.location !== order?.location
      ) {
        return acc;
      }

      // Date filters
      const orderDate = new Date((order?.table as Table).date);
      const beforeDate = filterPanelFormElements.before
        ? new Date(filterPanelFormElements.before)
        : null;
      const afterDate = filterPanelFormElements.after
        ? new Date(filterPanelFormElements.after)
        : null;

      if (
        (beforeDate && orderDate > beforeDate) ||
        (afterDate && orderDate < afterDate) ||
        !passesFilter(filterPanelFormElements.discount, order?.discount)
      ) {
        return acc;
      }

      const existingEntry = acc.find(
        (item) => item.discountId === order?.discount
      );

      if (existingEntry) {
        existingEntry.paidQuantity += order?.paidQuantity;
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
                      itemQuantityIteration.quantity + order?.paidQuantity,
                  }
                : itemQuantityIteration
          );
        } else {
          existingEntry.itemQuantity.push({
            itemId: order?.item,
            itemName: getItem(order?.item, items)?.name ?? "",
            quantity: order?.paidQuantity,
          });
        }

        existingEntry.collapsible = {
          collapsibleHeader: t("Products"),
          collapsibleColumns: [
            { key: t("Product"), isSortable: true },
            { key: t("Quantity"), isSortable: true },
          ],
          collapsibleRows: existingEntry.itemQuantity.map(
            (itemQuantityIteration) => ({
              product: itemQuantityIteration.itemName,
              quantity: itemQuantityIteration.quantity,
            })
          ),
          collapsibleRowKeys: [{ key: "product" }, { key: "quantity" }],
        };
      } else {
        acc.push({
          item: order?.item,
          itemName: getItem(order?.item, items)?.name ?? "",
          paidQuantity: order?.paidQuantity,
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
              quantity: order?.paidQuantity,
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
                quantity: order?.paidQuantity,
              },
            ],
            collapsibleRowKeys: [{ key: "product" }, { key: "quantity" }],
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
  allRows.length > 0 &&
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
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Discount"), isSortable: true },
    { key: t("Quantity"), isSortable: true },
  ];
  const rowKeys = [
    {
      key: "discountName",
      node: (row: any) => {
        return <p className={`${row?.className}`}>{row.discountName}</p>;
      },
    },
    {
      key: "paidQuantity",
      node: (row: any) => {
        return (
          <p className={`${row?.className} text-center `}>{row.paidQuantity}</p>
        );
      },
    },
  ];
  const filterPanelInputs = [
    LocationInput({ locations: locations, required: true }),
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
    },
    {
      type: InputTypes.DATE,
      formKey: "before",
      label: t("End Date"),
      placeholder: t("End Date"),
      required: true,
      isDatePicker: true,
      invalidateKeys: [{ key: "date", defaultValue: "" }],
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
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [orders, filterPanelFormElements, discounts, items, locations]);
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
      </div>
    </>
  );
};

export default DiscountBasedSales;
