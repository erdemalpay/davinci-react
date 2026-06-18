import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ShopifyAdminCustomer, ShopifyAdminCustomerOrder } from "../../types";
import GenericTable from "../panelComponents/Tables/GenericTable";

type Props = { customer?: ShopifyAdminCustomer };

type OrderRow = {
  shopifyOrderNumber: string;
  createdAt: string;
  productCount: number;
  collapsible: {
    collapsibleColumns: { key: string; isSortable: boolean }[];
    collapsibleRows: { itemName: string; quantity: number; unitPrice: string }[];
    collapsibleRowKeys: { key: string }[];
  };
};

const ShopifyCustomerOrders = ({ customer }: Props) => {
  const { t } = useTranslation();

  const columns = useMemo(
    () => [
      { key: t("Order No"), isSortable: false },
      { key: t("Products"), isSortable: false },
      { key: t("Date"), isSortable: false },
    ],
    [t]
  );

  const rows = useMemo((): OrderRow[] => {
    if (!customer?.orders) return [];

    const groups = new Map<string, ShopifyAdminCustomerOrder[]>();
    for (const order of customer.orders) {
      const key = order.shopifyOrderNumber ?? "-";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(order);
    }

    return Array.from(groups.entries()).map(([orderNo, items]) => ({
      shopifyOrderNumber: orderNo,
      createdAt: items[0].createdAt
        ? new Date(items[0].createdAt).toLocaleDateString("tr-TR")
        : "-",
      productCount: items.length,
      collapsible: {
        collapsibleColumns: [
          { key: t("Product"), isSortable: false },
          { key: t("Quantity"), isSortable: false },
          { key: t("Unit Price"), isSortable: false },
        ],
        collapsibleRows: items.map((item) => ({
          itemName: item.itemName ?? "-",
          quantity: item.quantity,
          unitPrice: `${item.unitPrice?.toFixed(2)} ₺`,
        })),
        collapsibleRowKeys: [
          { key: "itemName" },
          { key: "quantity" },
          { key: "unitPrice" },
        ],
      },
    }));
  }, [customer, t]);

  const rowKeys = useMemo(
    () => [
      { key: "shopifyOrderNumber" },
      { key: "productCount" },
      { key: "createdAt" },
    ],
    []
  );

  return (
    <div className="w-[95%] mx-auto my-6">
      <GenericTable
        title={t("Orders")}
        columns={columns}
        rowKeys={rowKeys}
        rows={rows}
        isActionsActive={false}
        isCollapsible={true}
        isPagination={false}
      />
    </div>
  );
};

export default ShopifyCustomerOrders;
