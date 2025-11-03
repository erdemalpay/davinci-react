import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../context/Order.context";
import { useUserContext } from "../../context/User.context";
import {
  ActionEnum,
  DateRangeKey,
  DisabledConditionEnum,
  OrderStatus,
  TURKISHLIRA,
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
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { useGetUsers } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import Loading from "../common/Loading";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

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
  formattedDate: string;
  category: string;
  categoryId: number;
  totalAmountWithDiscount: number;
  unitPriceQuantity: UnitPriceQuantity[];
  collapsible: any;
  className?: string;
  isSortable?: boolean;
};

const GroupedProductSalesReport = () => {
  const { t } = useTranslation();
  const orders = useGetOrders();
  const categories = useGetAllCategories();
  const items = useGetMenuItems();
  const sellLocations = useGetSellLocations();
  const users = useGetUsers();
  const discounts = useGetOrderDiscounts();
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();

  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
    showOrderDataFilters,
    setShowOrderDataFilters,
  } = useOrderContext();

  const groupedProductSalesPageDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.ORDERDATAS_GROUPEDPRODUCTSALESREPORT,
      disabledConditions
    );
  }, [disabledConditions]);

  if (!orders || !categories || !sellLocations) {
    return <Loading />;
  }

  const rows = useMemo(() => {
    const allRows = orders
      ?.filter((order) => order.status !== OrderStatus.CANCELLED)
      ?.reduce((acc, order) => {
        if (!order || order?.paidQuantity === 0) return acc;
        const zonedTime = toZonedTime(order.createdAt, "UTC");
        const orderDate = new Date(zonedTime);
        const existingEntry = acc.find((entry) => entry.item === order?.item);
        if (existingEntry) {
          (existingEntry.paidQuantity +=
            order?.status !== OrderStatus.RETURNED
              ? order?.paidQuantity
              : -order?.quantity),
            (existingEntry.discount += order?.discountPercentage
              ? order?.discountPercentage *
                order?.paidQuantity *
                order?.unitPrice *
                0.01
              : (order?.discountAmount ?? 0) * order?.paidQuantity);
          existingEntry.amount += order?.paidQuantity * order?.unitPrice;
          existingEntry.totalAmountWithDiscount +=
            order?.paidQuantity * order?.unitPrice -
            (order?.discountPercentage
              ? order?.discountPercentage *
                order?.paidQuantity *
                order?.unitPrice *
                0.01
              : (order?.discountAmount ?? 0) * order?.paidQuantity);
          const existingUnitPrice = existingEntry.unitPriceQuantity.find(
            (item) => item.unitPrice === order?.unitPrice
          );
          if (existingUnitPrice) {
            existingUnitPrice.quantity +=
              order?.status !== OrderStatus.RETURNED
                ? order?.paidQuantity
                : -order?.quantity;
          } else {
            existingEntry.unitPriceQuantity.push({
              unitPrice: order?.unitPrice,
              quantity:
                order?.status !== OrderStatus.RETURNED
                  ? order?.paidQuantity
                  : -order?.quantity,
            });
          }
          if (existingEntry.unitPriceQuantity.length > 1) {
            existingEntry.collapsible.collapsibleRows =
              existingEntry.unitPriceQuantity
                .map((item) => ({
                  unitPrice:
                    item.unitPrice.toFixed(2).replace(/\.?0*$/, "") +
                    " " +
                    TURKISHLIRA,
                  quantity: item.quantity,
                  unitPriceValue: item.unitPrice,
                }))
                .sort((a, b) => b.quantity - a.quantity);
          }
        } else {
          acc.push({
            item: order?.item,
            itemName: getItem(order?.item, items)?.name ?? "",
            unitPrice: order?.unitPrice,
            paidQuantity:
              order?.status !== OrderStatus.RETURNED
                ? order?.paidQuantity
                : -order?.quantity,
            discount: order?.discountPercentage
              ? order?.discountPercentage *
                order?.paidQuantity *
                order?.unitPrice *
                0.01
              : (order?.discountAmount ?? 0) * order?.paidQuantity,
            amount: order?.paidQuantity * order?.unitPrice,
            location: order?.location,
            date: format(orderDate, "yyyy-MM-dd"),
            formattedDate: format(orderDate, "dd-MM-yyyy"),
            category:
              categories?.find(
                (category) =>
                  category._id === getItem(order?.item, items)?.category
              )?.name ?? "",
            categoryId: getItem(order?.item, items)?.category ?? 0,
            unitPriceQuantity: [
              {
                unitPrice: order?.unitPrice,
                quantity:
                  order?.status !== OrderStatus.RETURNED
                    ? order?.paidQuantity
                    : -order?.quantity,
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
              order?.paidQuantity * order?.unitPrice -
              (order?.discountPercentage
                ? order?.discountPercentage *
                  order?.paidQuantity *
                  order?.unitPrice *
                  0.01
                : (order?.discountAmount ?? 0) * order?.paidQuantity),
          });
        }

        return acc;
      }, [] as OrderWithPaymentInfo[]);

    if (allRows.length > 0) {
      allRows.sort((a, b) => b.paidQuantity - a.paidQuantity);
      allRows.push({
        item: 0,
        itemName: t("Total"),
        isSortable: false,
        unitPrice: 0,
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
        formattedDate: "",
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
    }

    return allRows;
  }, [orders, categories, items, t]);

  const columns = useMemo(
    () => [
      { key: t("Product"), isSortable: true },
      { key: t("Quantity"), isSortable: true },
      { key: t("Category"), isSortable: true },
      { key: t("Unit Price"), isSortable: true },
      { key: t("Discount"), isSortable: true },
      { key: t("Total Amount"), isSortable: true },
      { key: t("General Amount"), isSortable: true },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "itemName",
        className: "min-w-fit pr-2",
        node: (row: any) => {
          return (
            <p key={"itemName" + row?.item} className={`${row?.className}`}>
              {row?.itemName}
            </p>
          );
        },
      },
      {
        key: "paidQuantity",
        node: (row: any) => {
          return (
            <p key={"paidQuantity" + row?.item} className={`${row?.className}`}>
              {row?.paidQuantity}
            </p>
          );
        },
      },
      { key: "category", className: "min-w-32 pr-2" },
      {
        key: "unitPrice",
        node: (row: any) => {
          return (
            <p className={`${row?.className}`} key={"unitPrice" + row?.item}>
              {row?.unitPriceQuantity.length > 1 || row?.unitPrice === 0
                ? ""
                : row?.unitPrice?.toFixed(2).replace(/\.?0*$/, "") +
                  " " +
                  TURKISHLIRA}
            </p>
          );
        },
      },
      {
        key: "discount",
        node: (row: any) => {
          return (
            <p className={`${row?.className}`} key={"discount" + row?.item}>
              {row?.discount?.toFixed(2) > 0 &&
                row?.discount?.toFixed(2).replace(/\.?0*$/, "") +
                  " " +
                  TURKISHLIRA}
            </p>
          );
        },
      },
      {
        key: "amount",
        node: (row: any) => {
          return (
            <p className={`${row?.className}`} key={"amount" + row?.item}>
              {row?.amount?.toFixed(2).replace(/\.?0*$/, "") +
                " " +
                TURKISHLIRA}
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
              key={"totalAmountWithDiscount" + row?.item}
            >
              {row?.totalAmountWithDiscount?.toFixed(2).replace(/\.?0*$/, "") +
                " " +
                TURKISHLIRA}
            </p>
          );
        },
      },
    ],
    []
  );

  const filterPanelInputs = useMemo(
    () => [
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
        formKey: "item",
        label: t("Menu Item"),
        options: items?.map((item) => {
          return {
            value: item?._id,
            label: item?.name,
          };
        }),
        isMultiple: true,
        placeholder: t("Menu Item"),
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
    ],
    [
      sellLocations,
      t,
      filterPanelFormElements,
      setFilterPanelFormElements,
      categories,
      items,
      discounts,
      users,
    ]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showOrderDataFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      closeFilters: () => setShowOrderDataFilters(false),
      additionalFilterCleanFunction: () => {
        setFilterPanelFormElements(initialFilterPanelFormElements);
      },
    }),
    [
      showOrderDataFilters,
      filterPanelInputs,
      filterPanelFormElements,
      setFilterPanelFormElements,
      setShowOrderDataFilters,
      initialFilterPanelFormElements,
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
        isDisabled: groupedProductSalesPageDisabledCondition?.actions?.some(
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
      groupedProductSalesPageDisabledCondition,
      user,
      showOrderDataFilters,
      setShowOrderDataFilters,
    ]
  );

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          filters={filters}
          filterPanel={filterPanel}
          title={t("Product Sales")}
          isActionsActive={false}
          isCollapsible={true}
        />
      </div>
    </>
  );
};

export default GroupedProductSalesReport;
