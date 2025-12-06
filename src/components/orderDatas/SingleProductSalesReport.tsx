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
import { useGetUsersMinimal } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

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
  className?: string;
  formattedDate: string;
  isSortable?: boolean;
};

const SingleProductSalesReport = () => {
  const { t } = useTranslation();
  const orders = useGetOrders();
  const categories = useGetAllCategories();
  const sellLocations = useGetSellLocations();
  const items = useGetMenuItems();
  const users = useGetUsersMinimal();
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

  const singleProductSalesPageDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.ORDERDATAS_SINGLEPRODUCTSALESREPORT,
      disabledConditions
    );
  }, [disabledConditions]);

  const rows = useMemo(() => {
    if (!orders || !categories || !sellLocations) {
      return [];
    }
    const allRows = orders
      ?.filter((order) => order.status !== OrderStatus.CANCELLED)
      ?.reduce((acc, order) => {
        if (!order || order?.paidQuantity === 0) return acc;
        const zonedTime = toZonedTime(order.createdAt, "UTC");
        const orderDate = new Date(zonedTime);
        acc.push({
          item: order?.item,
          itemName: getItem(order?.item, items)?.name ?? "",
          unitPrice: order?.unitPrice,
          paidQuantity:
            order?.status !== OrderStatus.RETURNED
              ? order?.paidQuantity
              : -order?.quantity,
          discount: order?.discountPercentage
            ? (order?.discountPercentage ?? 0) *
              order?.paidQuantity *
              order?.unitPrice *
              (1 / 100)
            : (order?.discountAmount ?? 0) * order?.paidQuantity,
          amount: order?.paidQuantity * order?.unitPrice,
          location: order?.location,
          date: format(orderDate, "yyyy-MM-dd"),
          formattedDate: order?.createdAt
            ? format(orderDate, "dd-MM-yyyy")
            : "",
          category:
            categories?.find(
              (category) =>
                category?._id === getItem(order?.item, items)?.category
            )?.name ?? "",
          categoryId: getItem(order?.item, items)?.category as number,
          totalAmountWithDiscount:
            order?.paidQuantity * order?.unitPrice -
            (order?.discountPercentage
              ? (order?.discountPercentage ?? 0) *
                order?.paidQuantity *
                order?.unitPrice *
                (1 / 100)
              : (order?.discountAmount ?? 0) * order?.paidQuantity),
        });
        return acc;
      }, [] as OrderWithPaymentInfo[]);

    if (allRows.length > 0) {
      allRows.sort((a, b) => b.paidQuantity - a.paidQuantity);
      allRows.unshift({
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
      });
    }
    return allRows;
  }, [orders, categories, items, t, sellLocations]);

  const columns = useMemo(
    () => [
      { key: t("Product"), isSortable: true },
      { key: t("Quantity"), isSortable: true },
      { key: t("Category"), isSortable: true },
      { key: t("Date"), isSortable: true },
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
          return <p className={`${row?.className}`}>{row?.itemName}</p>;
        },
      },
      {
        key: "paidQuantity",
        node: (row: any) => {
          return <p className={`${row?.className}`}>{row?.paidQuantity}</p>;
        },
      },
      { key: "category", className: "min-w-32 pr-2" },
      {
        key: "date",
        className: "min-w-32 pr-2",
        node: (row: any) => {
          return row?.formattedDate;
        },
      },
      {
        key: "unitPrice",
        node: (row: any) => {
          return (
            <p className={`${row?.className}`}>
              {row?.unitPrice > 0 &&
                row?.unitPrice?.toFixed(2).replace(/\.?0*$/, "") +
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
            <p className={`${row?.className}`}>
              {row?.discount !== 0
                ? row?.discount?.toFixed(2).replace(/\.?0*$/, "") +
                  " " +
                  TURKISHLIRA
                : ""}
            </p>
          );
        },
      },
      {
        key: "amount",
        node: (row: any) => {
          return (
            <p className={`${row?.className}`}>
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
            <p className={`${row?.className}`}>
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
        options: users.map((user) => ({
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
        options: users.map((user) => ({
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
        options: users.map((user) => ({
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
        options: users.map((user) => ({
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
        isDisabled: singleProductSalesPageDisabledCondition?.actions?.some(
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
      singleProductSalesPageDisabledCondition,
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
          title={t("Product Based Sales")}
          isActionsActive={false}
        />
      </div>
    </>
  );
};

export default SingleProductSalesReport;
