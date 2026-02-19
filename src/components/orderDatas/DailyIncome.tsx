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
  OrderCollectionStatus,
  TURKISHLIRA,
  commonDateOptions,
} from "../../types";
import { useGetAccountPaymentMethods } from "../../utils/api/account/paymentMethod";
import { dateRanges } from "../../utils/api/dateRanges";
import { Paths } from "../../utils/api/factory";
import { useGetSellLocations } from "../../utils/api/location";
import { useGetAllOrderCollections } from "../../utils/api/order/orderCollection";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

const DailyIncome = () => {
  const { t } = useTranslation();
  const collections = useGetAllOrderCollections();
  const sellLocations = useGetSellLocations();
  const queryClient = useQueryClient();
  const paymentMethods = useGetAccountPaymentMethods();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();

  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
    showOrderDataFilters,
    setShowOrderDataFilters,
  } = useOrderContext();

  const dailyIncomePageDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.ORDERDATAS_DAILYINCOME,
      disabledConditions
    );
  }, [disabledConditions]);

  const rows = useMemo(() => {
    if (!collections || !sellLocations || !paymentMethods) return [];
    const allRows = collections
      ?.filter(
        (collection) => collection.status !== OrderCollectionStatus.CANCELLED
      )
      ?.reduce((acc, collection) => {
        if (!collection?.tableDate) return acc;
        const zonedTime = toZonedTime(collection.tableDate, "UTC");
        const tableDate = format(zonedTime, "yyyy-MM-dd");
        if (!collection || !tableDate) return acc;
        const foundPaymentMethod = getItem(
          collection?.paymentMethod,
          paymentMethods
        );
        // Calculate adjusted amount with shipping and discount
        const adjustedAmount =
          (collection.amount || 0) +
          (collection.shopifyShippingAmount || 0) -
          (collection.shopifyDiscountAmount || 0);

        const existingEntry = acc.find((item) => item.date === tableDate);
        if (existingEntry) {
          paymentMethods.forEach((method) => {
            if (collection.paymentMethod === method._id) {
              existingEntry[method._id] =
                (existingEntry[method._id] || 0) + adjustedAmount;
            }
          });
          existingEntry.total += !foundPaymentMethod?.isPaymentMade
            ? 0
            : adjustedAmount;
        } else {
          const newEntry: any = {
            date: tableDate,
            formattedDate: formatAsLocalDate(tableDate),
            location: collection.location,
            total: !foundPaymentMethod?.isPaymentMade ? 0 : adjustedAmount,
          };
          paymentMethods.forEach((method) => {
            newEntry[method._id] =
              collection.paymentMethod === method._id ? adjustedAmount : 0;
          });

          acc.push(newEntry);
        }
        return acc;
      }, [] as any[]);

    allRows.unshift({
      date: t("Total"),
      formattedDate: t("Total"),
      location: 0,
      paymentMethod: "",
      ...paymentMethods.reduce((acc, method) => {
        acc[method._id] = allRows.reduce(
          (sum, row) => sum + row[method._id],
          0
        );
        return acc;
      }, {} as any),
      total: allRows.reduce((acc, row) => acc + row?.total, 0),
      className: "font-semibold",
      isSortable: false,
    });

    return allRows;
  }, [collections, paymentMethods, t]);

  const paymentMethodColumns = useMemo(() => {
    return paymentMethods.map((method) => ({
      key: t(method.name),
      isSortable: true,
    }));
  }, [paymentMethods, t]);

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: true },
      ...paymentMethodColumns,
      { key: t("Total"), isSortable: true },
    ],
    [t, paymentMethodColumns]
  );

  const paymentMethodRowKeys = useMemo(() => {
    return paymentMethods.map((method) => ({
      key: method._id,
      node: (row: any) => {
        return (
          <p className={`${row?.className}`}>
            {row[method._id] !== 0 &&
              row[method._id]?.toFixed(2).replace(/\.?0*$/, "") +
                " " +
                TURKISHLIRA}
          </p>
        );
      },
    }));
  }, [paymentMethods]);

  const rowKeys = useMemo(
    () => [
      {
        key: "date",
        className: "min-w-32 pr-2",
        node: (row: any) => {
          return <p className={`${row?.className}`}>{row?.formattedDate}</p>;
        },
      },
      ...paymentMethodRowKeys,
      {
        key: "total",
        node: (row: any) => {
          return (
            <p className={`${row?.className}`}>
              {row?.total !== 0 &&
                row?.total?.toFixed(2).replace(/\.?0*$/, "") +
                  " " +
                  TURKISHLIRA}
            </p>
          );
        },
      },
    ],
    [paymentMethodRowKeys]
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
    ],
    [sellLocations, t, filterPanelFormElements, setFilterPanelFormElements]
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
              queryClient.invalidateQueries({
                queryKey: [`${Paths.Order}/query`],
              });
              queryClient.invalidateQueries({
                queryKey: [`${Paths.Order}/collection/query`],
              });
            }}
          />
        ),
        isDisabled: dailyIncomePageDisabledCondition?.actions?.some(
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
      dailyIncomePageDisabledCondition,
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
          title={t("Daily Income")}
          isActionsActive={false}
        />
      </div>
    </>
  );
};

export default DailyIncome;
