import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { FavoriteProduct } from "../../utils/api/favorites";

export const formatFavoriteDate = (value?: string) =>
  value ? format(new Date(value), "dd.MM.yyyy HH:mm") : "-";

export const formatTl = (value: number | null) =>
  value === null ? "-" : `${value.toFixed(2)} ₺`;

// Image + title, linking to the product on kutuoyunual.com when it is published.
export function FavoriteProductCell({ product }: { product: FavoriteProduct }) {
  const { t } = useTranslation();
  const title = product.onlineStoreUrl ? (
    <a
      href={product.onlineStoreUrl}
      target="_blank"
      rel="noreferrer"
      className="text-blue-700 hover:text-blue-500"
    >
      {product.title}
    </a>
  ) : (
    <span>{product.title}</span>
  );
  return (
    <div className="flex items-center gap-3 min-w-[220px]">
      {product.imageUrl ? (
        <img
          src={`${product.imageUrl}${product.imageUrl.includes("?") ? "&" : "?"}width=96`}
          alt=""
          className="w-12 h-12 object-contain rounded bg-white border border-gray-100"
          loading="lazy"
        />
      ) : (
        <div className="w-12 h-12 rounded bg-gray-100" />
      )}
      <div className="flex flex-col">
        {title}
        {product.status !== "ACTIVE" && (
          <span className="text-xs text-gray-500">{t(product.status === "DRAFT" ? "Draft" : "Archived")}</span>
        )}
      </div>
    </div>
  );
}

export function FavoritePriceCell({ product }: { product: FavoriteProduct }) {
  const discounted =
    product.compareAtPrice !== null &&
    product.price !== null &&
    product.compareAtPrice > product.price;
  return (
    <div className="flex flex-col">
      <span>{formatTl(product.price)}</span>
      {discounted && (
        <span className="text-xs text-gray-400 line-through">
          {formatTl(product.compareAtPrice)}
        </span>
      )}
    </div>
  );
}

export function FavoriteStockCell({ product }: { product: FavoriteProduct }) {
  const { t } = useTranslation();
  if (product.totalInventory === null) return <span>-</span>;
  return (
    <span className={product.totalInventory > 0 ? "text-green-700" : "text-red-700"}>
      {product.totalInventory > 0 ? product.totalInventory : t("Out of stock")}
    </span>
  );
}
