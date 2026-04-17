import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { FormElementsState, Order } from "../../types";
import {
  useGetRetailerOrders,
  type RetailerOrdersResponse,
} from "../../utils/api/account/retailer";
import { formatAsLocalDate } from "../../utils/format";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

type RetailerOrderTableRow = {
  date: string;
  dateDisplay: string;
  totalOrders: number;
  collapsible: {
    collapsibleColumns: { key: string; isSortable: boolean }[];
    collapsibleRows: Array<
      Order & {
        tableNameDisplay: string;
        itemNameDisplay: string;
        orderedAtDisplay: string;
        statusDisplay: string;
        unitPriceDisplay: string;
        totalPriceDisplay: string;
      }
    >;
    collapsibleRowKeys: {
      key: string;
      node?: (
        row: Order & {
          tableNameDisplay: string;
          itemNameDisplay: string;
          orderedAtDisplay: string;
          statusDisplay: string;
          unitPriceDisplay: string;
          totalPriceDisplay: string;
        }
      ) => React.ReactNode;
      className?: string;
    }[];
  };
};

function formatDateLabel(dateValue: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split("-");
    return `${day}/${month}/${year}`;
  }

  return formatAsLocalDate(dateValue);
}

function getRetailerTableRows(
  data: RetailerOrdersResponse | undefined,
  t: (key: string) => string
): RetailerOrderTableRow[] {
  return (data?.groupedOrders ?? []).map((group) => {
    const collapsibleRows = group.orders.map((order) => {
      const orderDate = order.tableDate ?? order.createdAt;
      const unitPrice = Number(order.unitPrice ?? 0);
      const quantity = Number(order.quantity ?? 0);
      const totalPrice = unitPrice * quantity;

      const tableName =
        typeof order.table === "object" && order.table !== null
          ? (order.table as { name?: string }).name
          : "-";

      const itemName =
        typeof order.item === "object" && order.item !== null
          ? (order.item as { name?: string }).name
          : String(order.item ?? "-");

      return {
        ...order,
        tableNameDisplay: tableName || "-",
        itemNameDisplay: itemName || "-",
        statusDisplay: order.status || "-",
        orderedAtDisplay: orderDate
          ? `${formatAsLocalDate(String(orderDate))} ${format(
              new Date(orderDate),
              "HH:mm"
            )}`
          : "-",
        unitPriceDisplay: `${unitPrice} ₺`,
        totalPriceDisplay: `${totalPrice} ₺`,
      };
    });

    return {
      date: group.date,
      dateDisplay: formatDateLabel(group.date),
      totalOrders: group.orders.length,
      collapsible: {
        collapsibleColumns: [
          { key: t("Table"), isSortable: true },
          { key: t("Item"), isSortable: true },
          { key: t("Quantity"), isSortable: true },
          { key: t("Unit Price"), isSortable: true },
          { key: t("Total"), isSortable: true },
          { key: t("Status"), isSortable: true },
          { key: t("Ordered At"), isSortable: true },
        ],
        collapsibleRows,
        collapsibleRowKeys: [
          {
            key: "tableNameDisplay",
            className: "min-w-28",
          },
          {
            key: "itemNameDisplay",
            className: "min-w-40",
          },
          {
            key: "quantity",
            className: "min-w-24",
          },
          {
            key: "unitPriceDisplay",
            className: "min-w-24",
          },
          {
            key: "totalPriceDisplay",
            className: "min-w-24",
          },
          {
            key: "statusDisplay",
            className: "min-w-28",
          },
          {
            key: "orderedAtDisplay",
            className: "min-w-40",
          },
        ],
      },
    };
  });
}

const RetailerOrders = () => {
  const { t } = useTranslation();
  const { retailerId } = useParams();

  const initialFilterFormElements = useMemo(
    () => ({
      after: "",
      before: "",
    }),
    []
  );

  const [showFilters, setShowFilters] = useState(false);
  const [filterFormElements, setFilterFormElements] =
    useState<FormElementsState>(initialFilterFormElements);

  const retailerOrdersData = useGetRetailerOrders(retailerId, {
    after: (filterFormElements.after as string) || undefined,
    before: (filterFormElements.before as string) || undefined,
  });

  const rows = useMemo(
    () => getRetailerTableRows(retailerOrdersData, t),
    [retailerOrdersData, t]
  );

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: true, correspondingKey: "date" },
      {
        key: t("Total Orders"),
        isSortable: true,
        correspondingKey: "totalOrders",
      },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "dateDisplay",
        className: "min-w-32 font-medium",
      },
      {
        key: "totalOrders",
        className: "min-w-24",
      },
    ],
    []
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.DATE,
        formKey: "after",
        label: t("Start Date"),
        placeholder: t("Start Date"),
        required: true,
        isDatePicker: true,
        isOnClearActive: false,
      },
      {
        type: InputTypes.DATE,
        formKey: "before",
        label: t("End Date"),
        placeholder: t("End Date"),
        required: true,
        isDatePicker: true,
        isOnClearActive: false,
      },
    ],
    [t]
  );

  const tableFilters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showFilters}
            onChange={() => {
              setShowFilters(!showFilters);
            }}
          />
        ),
      },
    ],
    [t, showFilters]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs: filterPanelInputs,
      formElements: filterFormElements,
      setFormElements: setFilterFormElements,
      closeFilters: () => setShowFilters(false),
      additionalFilterCleanFunction: () => {
        setFilterFormElements(initialFilterFormElements);
      },
    }),
    [
      showFilters,
      filterPanelInputs,
      filterFormElements,
      initialFilterFormElements,
    ]
  );

  return (
    <div className="w-[95%] mx-auto my-6">
      <GenericTable<RetailerOrderTableRow>
        title={retailerOrdersData?.retailer?.name || t("Retailer Orders")}
        rows={rows}
        columns={columns}
        rowKeys={rowKeys}
        filters={tableFilters}
        filterPanel={filterPanel}
        isActionsActive={false}
        isCollapsible={true}
        isPagination={false}
      />
    </div>
  );
};

export default RetailerOrders;
