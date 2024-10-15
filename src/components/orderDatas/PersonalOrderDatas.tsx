import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../context/Order.context";
import {
  commonDateOptions,
  DateRangeKey,
  Order,
  OrderStatus,
  Table,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetOrders } from "../../utils/api/order/order";
import { useGetOrderDiscounts } from "../../utils/api/order/orderDiscount";
import { useGetUsers } from "../../utils/api/user";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";
interface PersonalOrderData {
  user: string;
  createdByCount: number;
  createdByTableCount: number;
  preparedByCount: number;
  preparedByTableCount: number;
  cancelledByCount: number;
  cancelledByTableCount: number;
  deliveredByCount: number;
  deliveredByTableCount: number;
  createdByTables: Set<number>;
  preparedByTables: Set<number>;
  cancelledByTables: Set<number>;
  deliveredByTables: Set<number>;
}
interface RoleDetail {
  key: keyof Order;
  countProp: keyof PersonalOrderDataCounts;
  tableProp: keyof PersonalOrderDataTables;
  tableCountProp: keyof PersonalOrderDataCounts;
}

type PersonalOrderDataCounts = Pick<
  PersonalOrderData,
  | "createdByCount"
  | "preparedByCount"
  | "cancelledByCount"
  | "deliveredByCount"
  | "createdByTableCount"
  | "preparedByTableCount"
  | "cancelledByTableCount"
  | "deliveredByTableCount"
>;
type PersonalOrderDataTables = Pick<
  PersonalOrderData,
  | "createdByTables"
  | "preparedByTables"
  | "cancelledByTables"
  | "deliveredByTables"
>;

const PersonalOrderDatas = () => {
  const { t } = useTranslation();
  const orders = useGetOrders();
  const users = useGetUsers();
  const discounts = useGetOrderDiscounts();
  const [tableKey, setTableKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const { filterPanelFormElements, setFilterPanelFormElements } =
    useOrderContext();
  if (!orders || !users || !discounts) {
    return null;
  }

  const roles: RoleDetail[] = [
    {
      key: "createdBy",
      countProp: "createdByCount",
      tableProp: "createdByTables",
      tableCountProp: "createdByTableCount",
    },
    {
      key: "preparedBy",
      countProp: "preparedByCount",
      tableProp: "preparedByTables",
      tableCountProp: "preparedByTableCount",
    },
    {
      key: "cancelledBy",
      countProp: "cancelledByCount",
      tableProp: "cancelledByTables",
      tableCountProp: "cancelledByTableCount",
    },
    {
      key: "deliveredBy",
      countProp: "deliveredByCount",
      tableProp: "deliveredByTables",
      tableCountProp: "deliveredByTableCount",
    },
  ];
  const allRows: PersonalOrderData[] = orders.reduce<PersonalOrderData[]>(
    (acc, order) => {
      if (!order || !order.createdAt) {
        return acc;
      }
      if (
        !(
          filterPanelFormElements.before === "" ||
          format(order.createdAt, "yyyy-MM-dd") <=
            filterPanelFormElements.before
        ) ||
        filterPanelFormElements.discount.includes(order.discount)
      ) {
        return acc;
      }

      roles.forEach(({ key, countProp, tableProp, tableCountProp }) => {
        const userId = order[key as keyof Order];
        const tableId = (order.table as Table)._id;
        if (userId && tableId) {
          let userRecord = acc.find((item) => item.user === userId);
          if (!userRecord) {
            userRecord = {
              user: userId,
              createdByCount: 0,
              preparedByCount: 0,
              cancelledByCount: 0,
              deliveredByCount: 0,
              createdByTableCount: 0,
              preparedByTableCount: 0,
              cancelledByTableCount: 0,
              deliveredByTableCount: 0,
              createdByTables: new Set<number>(),
              preparedByTables: new Set<number>(),
              cancelledByTables: new Set<number>(),
              deliveredByTables: new Set<number>(),
            };
            acc.push(userRecord);
          }
          if (order.status === OrderStatus.CANCELLED) {
            if (countProp === "cancelledByCount") {
              userRecord[countProp]++;
              if (userRecord[tableProp] instanceof Set) {
                userRecord[tableProp].add(tableId as number);
                userRecord[tableCountProp] = userRecord[tableProp].size;
              }
            }
          } else {
            userRecord[countProp]++;
            if (userRecord[tableProp] instanceof Set) {
              userRecord[tableProp].add(tableId as number);
              userRecord[tableCountProp] = userRecord[tableProp].size;
            }
          }
        }
      });
      return acc;
    },
    []
  );

  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("User"), isSortable: true },
    { key: t("Created By Count"), isSortable: true },
    { key: t("Table Count"), isSortable: true },
    { key: t("Prepared By Count"), isSortable: true },
    { key: t("Table Count"), isSortable: true },
    { key: t("Delivered By Count"), isSortable: true },
    { key: t("Table Count"), isSortable: true },
    { key: t("Cancelled By Count"), isSortable: true },
    { key: t("Table Count"), isSortable: true },
  ];
  const rowKeys = [
    {
      key: "user",
      node: (row: PersonalOrderData) => {
        const user = users.find((user) => user._id === row.user);
        return user?.name;
      },
    },
    { key: "createdByCount" },
    { key: "createdByTableCount" },
    { key: "preparedByCount" },
    { key: "preparedByTableCount" },
    { key: "deliveredByCount" },
    { key: "deliveredByTableCount" },
    { key: "cancelledByCount" },
    { key: "cancelledByTableCount" },
  ];
  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "discount",
      label: t("Eliminate Discount"),
      options: discounts.map((discount) => {
        return {
          value: discount._id,
          label: discount.name,
        };
      }),
      isMultiple: true,
      placeholder: t("Eliminate Discount"),
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
    setTableKey((prev) => prev + 1);
  }, [orders, users, filterPanelFormElements, discounts]);
  return (
    <>
      <div className="w-[95%] mx-auto mb-auto ">
        <GenericTable
          key={tableKey}
          title={t("Personal Order Datas")}
          columns={columns}
          rowKeys={rowKeys}
          rows={rows}
          isActionsActive={false}
          filterPanel={filterPanel}
          filters={filters}
        />
      </div>
    </>
  );
};

export default PersonalOrderDatas;
