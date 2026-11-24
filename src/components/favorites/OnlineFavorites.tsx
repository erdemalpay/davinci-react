import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import {
  FavoriteProductCustomer,
  TopFavoriteProduct,
  useGetFavoriteProductCustomers,
  useGetFavoritesSummary,
  useGetTopFavoriteProducts,
} from "../../utils/api/favorites";
import { StatCard } from "../loyalty/loyaltyTableParts";
import GenericTable from "../panelComponents/Tables/GenericTable";
import {
  FavoritePriceCell,
  FavoriteProductCell,
  FavoriteStockCell,
  formatFavoriteDate,
} from "./favoriteParts";

const DAY_MS = 24 * 60 * 60 * 1000;
const PERIODS = [
  { label: "All Time", days: 0 },
  { label: "Last 30 Days", days: 30 },
  { label: "Last 7 Days", days: 7 },
] as const;

// Consumers page tab: favorites across all kutuoyunual.com customers.
export default function OnlineFavorites() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setCurrentPage, setSearchQuery, setSortConfigKey } = useGeneralContext();
  const [periodDays, setPeriodDays] = useState<number>(0);
  const [selected, setSelected] = useState<TopFavoriteProduct | null>(null);

  // Rounded to the day so the query key doesn't change on every render.
  const after = useMemo(() => {
    if (!periodDays) return undefined;
    const start = new Date(Date.now() - periodDays * DAY_MS);
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }, [periodDays]);

  const summary = useGetFavoritesSummary();
  const products = useGetTopFavoriteProducts(100, after);
  const customers = useGetFavoriteProductCustomers(selected?.productId);

  const productColumns = useMemo(
    () => [
      { key: t("Product"), isSortable: false },
      { key: t("Favorites"), isSortable: false },
      { key: t("Price"), isSortable: false },
      { key: t("Stock"), isSortable: false },
      { key: t("Last Added"), isSortable: false },
    ],
    [t]
  );
  const productRowKeys = useMemo(
    () => [
      { key: "title", node: (row: TopFavoriteProduct) => <FavoriteProductCell product={row} /> },
      {
        key: "favoriteCount",
        node: (row: TopFavoriteProduct) => (
          <button
            type="button"
            className="text-blue-700 hover:text-blue-500 font-semibold underline"
            title={t("Show customers")}
            onClick={() => setSelected(row)}
          >
            {row.favoriteCount}
          </button>
        ),
      },
      { key: "price", node: (row: TopFavoriteProduct) => <FavoritePriceCell product={row} /> },
      { key: "totalInventory", node: (row: TopFavoriteProduct) => <FavoriteStockCell product={row} /> },
      { key: "lastAddedAt", node: (row: TopFavoriteProduct) => formatFavoriteDate(row.lastAddedAt) },
    ],
    [t]
  );

  const customerColumns = useMemo(
    () => [
      { key: t("Name"), isSortable: false },
      { key: t("Email"), isSortable: false },
      { key: t("Orders"), isSortable: false },
      { key: t("Added At"), isSortable: false },
    ],
    [t]
  );
  const customerRowKeys = useMemo(
    () => [
      {
        key: "name",
        node: (row: FavoriteProductCustomer) => (
          <p
            className="text-blue-700 w-fit cursor-pointer hover:text-blue-500"
            onClick={() => {
              setCurrentPage(1);
              setSearchQuery("");
              setSortConfigKey(null);
              navigate(`/shopify-customer/${row.customerId}`);
            }}
          >
            {row.name || row.customerId}
          </p>
        ),
      },
      { key: "email", node: (row: FavoriteProductCustomer) => row.email ?? "-" },
      { key: "numberOfOrders", node: (row: FavoriteProductCustomer) => row.numberOfOrders ?? "-" },
      { key: "addedAt", node: (row: FavoriteProductCustomer) => formatFavoriteDate(row.addedAt) },
    ],
    [navigate, setCurrentPage, setSearchQuery, setSortConfigKey]
  );

  return (
    <div className="w-[95%] mx-auto flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t("Total Favorites")} value={summary?.totalFavorites ?? 0} />
        <StatCard label={t("Customers with Favorites")} value={summary?.customerCount ?? 0} />
        <StatCard label={t("Favorited Products")} value={summary?.productCount ?? 0} />
        <StatCard label={t("Added in Last 30 Days")} value={summary?.addedLast30Days ?? 0} />
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((period) => (
          <button
            key={period.days}
            type="button"
            onClick={() => {
              setPeriodDays(period.days);
              setSelected(null);
            }}
            className={`px-3 py-1.5 rounded border text-sm ${
              periodDays === period.days
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            {t(period.label)}
          </button>
        ))}
      </div>

      {selected && (
        <GenericTable
          title={`${selected.title}: ${t("Customers who favorited")} (${customers?.length ?? 0})`}
          columns={customerColumns}
          rowKeys={customerRowKeys as any}
          rows={customers ?? []}
          isActionsActive={false}
          isColumnFilter={false}
          isSearch={false}
          filters={[
            {
              isUpperSide: false,
              node: (
                <button
                  type="button"
                  className="px-3 py-1.5 rounded border border-gray-300 text-sm bg-white"
                  onClick={() => setSelected(null)}
                >
                  {t("Close")}
                </button>
              ),
            },
          ]}
        />
      )}

      <GenericTable
        title={t("Most Favorited Products")}
        columns={productColumns}
        rowKeys={productRowKeys as any}
        rows={products ?? []}
        isActionsActive={false}
        isColumnFilter={false}
        isSearch={false}
      />
    </div>
  );
}
