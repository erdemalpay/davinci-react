import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ShopifyAdminCustomer } from "../../types";
import GenericTable from "../panelComponents/Tables/GenericTable";

type Props = { customer?: ShopifyAdminCustomer };

const ShopifyCustomerOrders = ({ customer }: Props) => {
  const { t } = useTranslation();

  const columns = useMemo(
    () => [
      { key: t("Order No"), isSortable: false },
      { key: t("Product"), isSortable: false },
      { key: t("Quantity"), isSortable: false },
      { key: t("Unit Price"), isSortable: false },
      { key: t("Date"), isSortable: false },
    ],
    [t]
  );

  const rows = useMemo(() => {
    if (!customer?.orders) return [];
    return customer.orders.map((o) => ({
      shopifyOrderNumber: o.shopifyOrderNumber ?? "-",
      itemName: o.itemName ?? "-",
      quantity: o.quantity,
      unitPrice: `${o.unitPrice?.toFixed(2)} ₺`,
      createdAt: o.createdAt
        ? new Date(o.createdAt).toLocaleDateString("tr-TR")
        : "-",
    }));
  }, [customer]);

  const rowKeys = useMemo(
    () => [
      { key: "shopifyOrderNumber" },
      { key: "itemName" },
      { key: "quantity" },
      { key: "unitPrice" },
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
        isPagination={false}
      />
    </div>
  );
};

export default ShopifyCustomerOrders;
