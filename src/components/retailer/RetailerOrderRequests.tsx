import { format } from "date-fns";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import type { MenuItem } from "../../types";
import {
  RetailerOrderRequest,
  useGetAccountRetailers,
  useGetRetailerOrderRequests,
} from "../../utils/api/account/retailer";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { toIstDate } from "../../utils/format";
import GenericTable from "../panelComponents/Tables/GenericTable";

type RetailerOrderRequestProductRow = {
  productNameDisplay: string;
  productDavinciIdDisplay: string;
  productIdDisplay: string;
  quantity: number;
};

type RetailerOrderRequestTableRow = {
  _id: number | string;
  date: string;
  dateDisplay: string;
  orderIdDisplay: string;
  statusDisplay: string;
  productCount: number;
  createdAt: string;
  createdAtDisplay: string;
  collapsible: {
    collapsibleColumns: { key: string; isSortable: boolean }[];
    collapsibleRows: RetailerOrderRequestProductRow[];
    collapsibleRowKeys: {
      key: string;
      className?: string;
    }[];
  };
};

function formatDate(date?: string) {
  if (!date) {
    return "-";
  }

  const parsedDate = toIstDate(date);
  return parsedDate ? format(parsedDate, "dd/MM/yyyy") : "-";
}

function buildMenuItemNameById(menuItems: MenuItem[]) {
  return menuItems.reduce<Record<string, string>>((acc, item) => {
    acc[String(item._id)] = item.name;
    return acc;
  }, {});
}

function getRetailerOrderRequestRows(
  orderRequests: RetailerOrderRequest[] | undefined,
  menuItems: MenuItem[],
  t: (key: string) => string
): RetailerOrderRequestTableRow[] {
  const menuItemNameById = buildMenuItemNameById(menuItems);

  return (orderRequests ?? []).map((orderRequest) => {
    const collapsibleRows = (orderRequest.products ?? []).map((product) => {
      const productDavinciId = String(product.productDavinciId ?? "-");
      const productName = menuItemNameById[productDavinciId];

      return {
        productNameDisplay: productName || productDavinciId,
        productDavinciIdDisplay: productDavinciId,
        productIdDisplay: product.productId || "-",
        quantity: Number(product.quantity ?? 0),
      };
    });

    return {
      _id: orderRequest._id,
      date: orderRequest.date ? String(orderRequest.date) : "",
      dateDisplay: formatDate(orderRequest.date),
      orderIdDisplay: orderRequest.orderId || "-",
      statusDisplay: orderRequest.status || "-",
      productCount: collapsibleRows.length,
      createdAt: orderRequest.createdAt ? String(orderRequest.createdAt) : "",
      createdAtDisplay: formatDate(orderRequest.createdAt),
      collapsible: {
        collapsibleColumns: [
          { key: t("Product"), isSortable: true },
          { key: t("Quantity"), isSortable: true },
        ],
        collapsibleRows,
        collapsibleRowKeys: [
          {
            key: "productNameDisplay",
            className: "min-w-40",
          },
          {
            key: "quantity",
            className: "min-w-24",
          },
        ],
      },
    };
  });
}

const RetailerOrderRequests = () => {
  const { t } = useTranslation();
  const { retailerId } = useParams();
  const retailers = useGetAccountRetailers();
  const menuItems = useGetMenuItems();

  const currentRetailer = retailers?.find(
    (retailer) => String(retailer._id) === retailerId
  );

  const orderRequests = useGetRetailerOrderRequests({
    tenantSlug: currentRetailer?.tenantSlug,
    projectSlug: currentRetailer?.projectSlug,
  });

  const rows = useMemo(
    () => getRetailerOrderRequestRows(orderRequests, menuItems, t),
    [orderRequests, menuItems, t]
  );

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: true, correspondingKey: "date" },
      {
        key: t("Order ID"),
        isSortable: true,
        correspondingKey: "orderIdDisplay",
      },
      {
        key: t("Status"),
        isSortable: true,
        correspondingKey: "statusDisplay",
      },
      {
        key: t("Products"),
        isSortable: true,
        correspondingKey: "productCount",
      },
      {
        key: t("Created At"),
        isSortable: true,
        correspondingKey: "createdAt",
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
        key: "orderIdDisplay",
        className: "min-w-52",
      },
      {
        key: "statusDisplay",
        className: "min-w-28 capitalize",
      },
      {
        key: "productCount",
        className: "min-w-24",
      },
      {
        key: "createdAtDisplay",
        className: "min-w-32",
      },
    ],
    []
  );

  return (
    <div className="w-[95%] mx-auto my-6">
      <GenericTable<RetailerOrderRequestTableRow>
        title={currentRetailer?.name || t("Retailer Order Requests")}
        rows={rows}
        columns={columns}
        rowKeys={rowKeys}
        isActionsActive={false}
        isCollapsible={true}
        isPagination={false}
      />
    </div>
  );
};

export default RetailerOrderRequests;
