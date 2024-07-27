import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { Location, MenuItem, Table, TURKISHLIRA } from "../../types";
import { useGetLocations } from "../../utils/api/location";
import { useGetCategories } from "../../utils/api/menu/category";
import { useGetOrders } from "../../utils/api/order/order";
import { useGetAllOrderPayments } from "../../utils/api/order/orderPayment";
import { LocationInput } from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

type Props = {};
type UnitPriceQuantity = {
  unitPrice: number;
  quantity: number;
};
type OrderWithPaymentInfo = {
  item: number;
  itemName: string;
  unitPrice: number;
  paidQuantity: number;
  discount: number;
  amount: number;
  location: number;
  date: string;
  category: string;
  categoryId: number;
  totalAmountWithDiscount: number;
  unitPriceQuantity: UnitPriceQuantity[];
  collapsible: any;
  className?: string;
};
type FormElementsState = {
  [key: string]: any;
};
const GroupedProductSalesReport = (props: Props) => {
  const { t } = useTranslation();
  const orderPayments = useGetAllOrderPayments();
  const orders = useGetOrders();
  const categories = useGetCategories();
  const locations = useGetLocations();
  const [showFilters, setShowFilters] = useState(false);
  if (!orderPayments || !orders || !categories || !locations) {
    return null;
  }
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      location: "",
      category: "",
      before: "",
      after: "",
    });
  const { setExpandedRows } = useGeneralContext();
  const [tableKey, setTableKey] = useState(0);
  const orderWithInfo = orderPayments.reduce((acc, orderPayment) => {
    if (!orderPayment.orders) return acc;
    orderPayment.orders.forEach((orderPaymentItem) => {
      const foundOrder = orders.find(
        (orderItem) => orderItem._id === orderPaymentItem.order
      );
      if (!foundOrder || orderPaymentItem.paidQuantity === 0) return;
      // location filter
      if (
        filterPanelFormElements.location !== "" &&
        filterPanelFormElements.location !==
          (foundOrder.location as Location)._id
      ) {
        return;
      }
      // other filters
      if (
        (filterPanelFormElements.before !== "" &&
          (foundOrder.table as Table).date > filterPanelFormElements.before) ||
        (filterPanelFormElements.after !== "" &&
          (foundOrder.table as Table).date < filterPanelFormElements.after) ||
        !passesFilter(
          filterPanelFormElements.category,
          (foundOrder.item as MenuItem).category as number
        )
      ) {
        return;
      }
      const existingEntry = acc.find(
        (item) => item.item === (foundOrder.item as MenuItem)._id
      );

      if (existingEntry) {
        existingEntry.paidQuantity += orderPaymentItem.paidQuantity;
        existingEntry.discount +=
          (orderPaymentItem?.discountPercentage ?? 0) *
          orderPaymentItem.paidQuantity *
          foundOrder.unitPrice *
          (1 / 100);
        existingEntry.amount +=
          orderPaymentItem.paidQuantity * foundOrder.unitPrice;
        existingEntry.totalAmountWithDiscount =
          existingEntry.totalAmountWithDiscount +
          orderPaymentItem.paidQuantity * foundOrder.unitPrice -
          (orderPaymentItem?.discountPercentage ?? 0) *
            orderPaymentItem.paidQuantity *
            foundOrder.unitPrice *
            (1 / 100);
        const existingUnitPrice = existingEntry.unitPriceQuantity.find(
          (item) => item.unitPrice === foundOrder.unitPrice
        );
        if (existingUnitPrice) {
          existingEntry.unitPriceQuantity = [
            ...existingEntry.unitPriceQuantity.filter(
              (item) => item.unitPrice !== foundOrder.unitPrice
            ),
            {
              unitPrice: foundOrder.unitPrice,
              quantity:
                orderPaymentItem.paidQuantity + existingUnitPrice.quantity,
            },
          ];
        } else {
          existingEntry.unitPriceQuantity.push({
            unitPrice: foundOrder.unitPrice,
            quantity: orderPaymentItem.paidQuantity,
          });
          existingEntry.collapsible = {
            collapsibleColumns: [
              { key: t("Unit Price"), isSortable: true },
              { key: t("Quantity"), isSortable: true },
            ],
            collapsibleRows: existingEntry.unitPriceQuantity?.map(
              (unitPriceQuantityItem) => ({
                unitPrice:
                  unitPriceQuantityItem.unitPrice.toString() +
                  " " +
                  TURKISHLIRA,
                quantity: unitPriceQuantityItem.quantity,
              })
            ),
            collapsibleRowKeys: [{ key: "unitPrice" }, { key: "quantity" }],
          };
        }
      } else {
        acc.push({
          item: (foundOrder.item as MenuItem)._id,
          itemName: (foundOrder.item as MenuItem).name,
          unitPrice: foundOrder.unitPrice,
          paidQuantity: orderPaymentItem.paidQuantity,
          discount:
            (orderPaymentItem?.discountPercentage ?? 0) *
            orderPaymentItem.paidQuantity *
            foundOrder.unitPrice *
            (1 / 100),
          amount: orderPaymentItem.paidQuantity * foundOrder.unitPrice,
          location: (foundOrder.location as Location)._id,
          date: (foundOrder.table as Table).date,
          category:
            categories.find(
              (category) =>
                category._id === (foundOrder.item as MenuItem).category
            )?.name ?? "",
          categoryId: (foundOrder.item as MenuItem).category as number,
          unitPriceQuantity: [
            {
              unitPrice: foundOrder.unitPrice,
              quantity: orderPaymentItem.paidQuantity,
            },
          ],
          collapsible: {
            collapsibleColumns: [
              { key: t("Unit Price"), isSortable: true },
              { key: t("Quantity"), isSortable: true },
            ],
            collapsibleRows: [],
            collapsibleRowKeys: [{ key: "unitPrice" }, { key: "quantity" }],
          },
          totalAmountWithDiscount:
            orderPaymentItem.paidQuantity * foundOrder.unitPrice -
            (orderPaymentItem?.discountPercentage ?? 0) *
              orderPaymentItem.paidQuantity *
              foundOrder.unitPrice *
              (1 / 100),
        });
      }
    });

    return acc;
  }, [] as OrderWithPaymentInfo[]);
  orderWithInfo.length > 0 &&
    orderWithInfo.push({
      item: 0,
      itemName: "Toplam",
      unitPrice: 0,
      paidQuantity: orderWithInfo.reduce(
        (acc, item) => acc + item.paidQuantity,
        0
      ),
      className: "font-semibold",
      discount: orderWithInfo.reduce((acc, item) => acc + item.discount, 0),
      amount: orderWithInfo.reduce((acc, item) => acc + item.amount, 0),
      totalAmountWithDiscount: orderWithInfo.reduce(
        (acc, item) => acc + item.totalAmountWithDiscount,
        0
      ),
      location: 4,
      date: "",
      category: " ",
      categoryId: 0,
      unitPriceQuantity: [],
      collapsible: {
        collapsibleColumns: [
          { key: t("Unit Price"), isSortable: true },
          { key: t("Quantity"), isSortable: true },
        ],
        collapsibleRows: [],
        collapsibleRowKeys: [{ key: "unitPrice" }, { key: "quantity" }],
      },
    });
  const [rows, setRows] = useState(orderWithInfo);
  const columns = [
    { key: t("Product Name"), isSortable: true },
    { key: t("Quantity"), isSortable: true },
    { key: t("Category"), isSortable: true },
    { key: t("Unit Price"), isSortable: true },
    { key: t("Discount"), isSortable: true },
    { key: t("Total Amount"), isSortable: true },
    { key: t("General Amount"), isSortable: true },
  ];
  const rowKeys = [
    {
      key: "itemName",
      className: "min-w-fit pr-2",
      node: (row: any) => {
        return (
          <p key={"itemName" + row.item} className={`${row?.className}`}>
            {row.itemName}
          </p>
        );
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
    { key: "category", className: "min-w-32 pr-2" },
    {
      key: "unitPrice",
      node: (row: any) => {
        return (
          <p className={`${row?.className}`} key={"unitPrice" + row.item}>
            {row.unitPriceQuantity.length > 1 || row.unitPrice === 0
              ? ""
              : row.unitPrice + " " + TURKISHLIRA}
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
    setRows(orderWithInfo);
    setExpandedRows({});
    setTableKey((prev) => prev + 1);
  }, [orders, orderPayments, categories, filterPanelFormElements]);
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
          title={t("Product Sales Report")}
          isActionsActive={false}
          isCollapsible={true}
        />
      </div>
    </>
  );
};

export default GroupedProductSalesReport;
