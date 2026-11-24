import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ShopifyAdminCustomer } from "../../types";
import { CustomerFavorite, useGetCustomerFavorites } from "../../utils/api/favorites";
import GenericTable from "../panelComponents/Tables/GenericTable";
import {
  FavoritePriceCell,
  FavoriteProductCell,
  FavoriteStockCell,
  formatFavoriteDate,
} from "./favoriteParts";

type Props = { customer?: ShopifyAdminCustomer };

// What one Shopify customer hearted on kutuoyunual.com, newest first.
export default function ShopifyCustomerFavorites({ customer }: Props) {
  const { t } = useTranslation();
  const customerId = customer?.id.split("/").pop();
  const favorites = useGetCustomerFavorites(customerId);

  const columns = useMemo(
    () => [
      { key: t("Product"), isSortable: false },
      { key: t("Price"), isSortable: false },
      { key: t("Stock"), isSortable: false },
      { key: t("Added At"), isSortable: false },
    ],
    [t]
  );
  const rowKeys = useMemo(
    () => [
      { key: "title", node: (row: CustomerFavorite) => <FavoriteProductCell product={row} /> },
      { key: "price", node: (row: CustomerFavorite) => <FavoritePriceCell product={row} /> },
      { key: "totalInventory", node: (row: CustomerFavorite) => <FavoriteStockCell product={row} /> },
      { key: "addedAt", node: (row: CustomerFavorite) => formatFavoriteDate(row.addedAt) },
    ],
    []
  );

  if (!customerId) return null;

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        title={`${t("Favorites")} (${favorites?.length ?? 0})`}
        columns={columns}
        rowKeys={rowKeys as any}
        rows={favorites ?? []}
        isActionsActive={false}
        isColumnFilter={false}
        isSearch={false}
      />
    </div>
  );
}
