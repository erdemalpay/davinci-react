import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { useOrderContext } from "../../context/Order.context";
import { Location, MenuItem, Table, TURKISHLIRA } from "../../types";
import { useGetLocations } from "../../utils/api/location";
import { useGetCategories } from "../../utils/api/menu/category";
import { useGetOrders } from "../../utils/api/order/order";
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
  discount: number;
  amount: number;
  location: number;
  date: string;
  category: string;
  categoryId: number;
  totalAmountWithDiscount: number;
  itemQuantity: ItemQuantity[];
  collapsible: any;
  className?: string;
  isSortable?: boolean;
};
const CategoryBasedSalesReport = () => {
  const { t } = useTranslation();
  const orders = useGetOrders();
  const categories = useGetCategories();
  const locations = useGetLocations();
  const [showFilters, setShowFilters] = useState(false);
  if (!orders || !categories || !locations) {
    return null;
  }
  const { filterPanelFormElements, setFilterPanelFormElements } =
    useOrderContext();
  const { setExpandedRows } = useGeneralContext();
  const [tableKey, setTableKey] = useState(0);
  const allRows = orders.reduce((acc, order) => {
    if (!order || order.paidQuantity === 0) return acc;

    // Location filter
    if (
      filterPanelFormElements.location !== "" &&
      filterPanelFormElements.location !== (order.location as Location)._id
    ) {
      return acc;
    }

    // Date filters
    const orderDate = new Date((order.table as Table).date);
    const beforeDate = filterPanelFormElements.before
      ? new Date(filterPanelFormElements.before)
      : null;
    const afterDate = filterPanelFormElements.after
      ? new Date(filterPanelFormElements.after)
      : null;

    if (
      (beforeDate && orderDate > beforeDate) ||
      (afterDate && orderDate < afterDate) ||
      !passesFilter(
        filterPanelFormElements.category,
        (order.item as MenuItem).category as number
      )
    ) {
      return acc;
    }

    const existingEntry = acc.find(
      (item) => item.categoryId === (order.item as MenuItem).category
    );

    if (existingEntry) {
      existingEntry.paidQuantity += order.paidQuantity;
      existingEntry.discount +=
        (order?.discountPercentage ?? 0) *
        order.paidQuantity *
        order.unitPrice *
        (1 / 100);
      existingEntry.amount += order.paidQuantity * order.unitPrice;
      existingEntry.totalAmountWithDiscount =
        existingEntry.totalAmountWithDiscount +
        order.paidQuantity * order.unitPrice -
        (order?.discountPercentage ?? 0) *
          order.paidQuantity *
          order.unitPrice *
          (1 / 100);

      const existingItem = existingEntry.itemQuantity.find(
        (itemQuantityIteration) =>
          itemQuantityIteration.itemId === (order.item as MenuItem)._id
      );
      if (existingItem) {
        existingEntry.itemQuantity = existingEntry.itemQuantity.map(
          (itemQuantityIteration) =>
            itemQuantityIteration.itemId === existingItem.itemId
              ? {
                  ...itemQuantityIteration,
                  quantity: itemQuantityIteration.quantity + order.paidQuantity,
                }
              : itemQuantityIteration
        );
      } else {
        existingEntry.itemQuantity.push({
          itemId: (order.item as MenuItem)._id,
          itemName: (order.item as MenuItem).name,
          quantity: order.paidQuantity,
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
        item: (order.item as MenuItem)._id,
        itemName: (order.item as MenuItem).name,
        paidQuantity: order.paidQuantity,
        discount:
          (order?.discountPercentage ?? 0) *
          order.paidQuantity *
          order.unitPrice *
          (1 / 100),
        amount: order.paidQuantity * order.unitPrice,
        location: (order.location as Location)._id,
        date: format(orderDate, "yyyy-MM-dd"),
        category:
          categories.find(
            (category) => category._id === (order.item as MenuItem).category
          )?.name ?? "",
        categoryId: (order.item as MenuItem).category as number,
        itemQuantity: [
          {
            itemId: (order.item as MenuItem)._id,
            itemName: (order.item as MenuItem).name,
            quantity: order.paidQuantity,
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
              product: (order.item as MenuItem).name,
              quantity: order.paidQuantity,
            },
          ],
          collapsibleRowKeys: [{ key: "product" }, { key: "quantity" }],
        },
        totalAmountWithDiscount:
          order.paidQuantity * order.unitPrice -
          (order?.discountPercentage ?? 0) *
            order.paidQuantity *
            order.unitPrice *
            (1 / 100),
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
      discount: allRows.reduce((acc, item) => acc + item.discount, 0),
      amount: allRows.reduce((acc, item) => acc + item.amount, 0),
      totalAmountWithDiscount: allRows.reduce(
        (acc, item) => acc + item.totalAmountWithDiscount,
        0
      ),
      location: 4,
      date: "",
      category: t("Total"),
      isSortable: false,
      categoryId: 0,
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
    { key: t("Category"), isSortable: true },
    { key: t("Quantity"), isSortable: true },
    { key: t("Discount"), isSortable: true },
    { key: t("Total Amount"), isSortable: true },
    { key: t("General Amount"), isSortable: true },
  ];
  const rowKeys = [
    {
      key: "category",
      className: "min-w-32 pr-2",
      node: (row: any) => {
        return <p className={`${row?.className}`}>{row.category}</p>;
      },
    },

    {
      key: "paidQuantity",
      node: (row: any) => {
        return (
          <p key={"paidQuantity" + row.item} className={`${row?.className}`}>
            {row.paidQuantity}
          </p>
        );
      },
    },
    {
      key: "discount",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`} key={"discount" + row.item}>
            {row.discount > 0 && row.discount + " " + TURKISHLIRA}
          </p>
        );
      },
    },
    {
      key: "amount",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`} key={"amount" + row.item}>
            {row.amount + " " + TURKISHLIRA}
          </p>
        );
      },
    },
    {
      key: "totalAmountWithDiscount",
      node: (row: any) => {
        return (
          <p
            className={`${row?.className}`}
            key={"totalAmountWithDiscount" + row.item}
          >
            {row.totalAmountWithDiscount + " " + TURKISHLIRA}
          </p>
        );
      },
    },
  ];

  const filterPanelInputs = [
    LocationInput({ locations: locations, required: true }),
    {
      type: InputTypes.SELECT,
      formKey: "category",
      label: t("Category"),
      options: categories.map((category) => {
        return {
          value: category._id,
          label: category.name,
        };
      }),
      placeholder: t("Category"),
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
    setRows(allRows);
    setExpandedRows({});
    setTableKey((prev) => prev + 1);
  }, [orders, categories, filterPanelFormElements]);
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
          title={t("Category Based Sales")}
          isActionsActive={false}
          isCollapsible={true}
        />
      </div>
    </>
  );
};

export default CategoryBasedSalesReport;
