import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useGetPriceCompareHashmap } from "../../utils/api/priceCompare";
import GenericTable from "../panelComponents/Tables/GenericTable";

type PriceCompareRow = {
  key: string;
  name: string;
  bestSite: string;
  minPrice: number;
  maxPrice: number;
  priceGap: number;
  availableSiteCount: number;
  [siteKey: string]: string | number;
};

const PRICE_DECIMALS = 2;

const toLabelFromKey = (siteKey: string) => {
  if (!siteKey) return "-";
  return siteKey.charAt(0).toUpperCase() + siteKey.slice(1);
};

const LocalPriceComparision = () => {
  const { t } = useTranslation();
  const response = useGetPriceCompareHashmap();

  const siteEntries = useMemo(() => {
    const sitesMap = response?.sites ?? {};
    const siteOrder = Object.keys(sitesMap);

    const keysFromHashmap = new Set<string>();
    Object.values(response?.hashmap ?? {}).forEach((item) => {
      Object.keys(item.prices ?? {}).forEach((priceSiteKey) => {
        keysFromHashmap.add(priceSiteKey);
      });
    });

    // Keep backend-provided order first, then append extra site keys found in prices.
    const mergedKeys = [
      ...siteOrder,
      ...Array.from(keysFromHashmap).filter((key) => !siteOrder.includes(key)),
    ];

    return mergedKeys.map(
      (siteKey) =>
        [siteKey, sitesMap[siteKey] ?? toLabelFromKey(siteKey)] as const
    );
  }, [response?.sites, response?.hashmap]);

  const rows = useMemo<PriceCompareRow[]>(() => {
    const hashmap = response?.hashmap ?? {};

    return Object.entries(hashmap).map(([itemKey, item]) => {
      let minPrice = Number.POSITIVE_INFINITY;
      let maxPrice = 0;
      let bestSite = "-";
      let availableSiteCount = 0;

      const sitePriceMap: Record<string, string | number> = {};

      siteEntries.forEach(([siteKey, siteLabel]) => {
        const rawPrice = item.prices[siteKey];
        if (typeof rawPrice === "number") {
          const normalizedPrice = Number(rawPrice.toFixed(PRICE_DECIMALS));
          sitePriceMap[siteKey] = normalizedPrice;
          availableSiteCount += 1;

          if (normalizedPrice < minPrice) {
            minPrice = normalizedPrice;
            bestSite = siteLabel;
          }

          if (normalizedPrice > maxPrice) {
            maxPrice = normalizedPrice;
          }
        } else {
          sitePriceMap[siteKey] = "-";
        }
      });

      const hasAnyPrice = availableSiteCount > 0;

      return {
        key: itemKey,
        name: item.name,
        ...sitePriceMap,
        bestSite,
        minPrice: hasAnyPrice ? Number(minPrice.toFixed(PRICE_DECIMALS)) : 0,
        maxPrice: hasAnyPrice ? Number(maxPrice.toFixed(PRICE_DECIMALS)) : 0,
        priceGap: hasAnyPrice
          ? Number((maxPrice - minPrice).toFixed(PRICE_DECIMALS))
          : 0,
        availableSiteCount,
      };
    });
  }, [response?.hashmap, siteEntries]);

  const columns = useMemo(() => {
    return [
      { key: t("Product"), isSortable: true },
      ...siteEntries.map(([, siteLabel]) => ({
        key: siteLabel,
        isSortable: true,
      })),
      { key: t("Best Site"), isSortable: true },
      { key: t("Min Price"), isSortable: true },
      { key: t("Max Price"), isSortable: true },
      { key: t("Price Gap"), isSortable: true },
      { key: t("Available Sites"), isSortable: true },
    ];
  }, [siteEntries, t]);

  const rowKeys = useMemo(() => {
    return [
      { key: "name" },
      ...siteEntries.map(([siteKey]) => ({ key: siteKey })),
      { key: "bestSite" },
      { key: "minPrice" },
      { key: "maxPrice" },
      { key: "priceGap" },
      { key: "availableSiteCount" },
    ];
  }, [siteEntries]);

  const searchRowKeys = useMemo(
    () => [{ key: "key" }, { key: "name" }, { key: "bestSite" }],
    []
  );

  const tableTitle = t("Local Price Comparision");

  return (
    <div className="w-[95%] mx-auto">
      <div className="text-sm text-gray-600 mb-2"></div>
      <GenericTable
        rowKeys={rowKeys}
        searchRowKeys={searchRowKeys}
        columns={columns}
        rows={rows}
        title={tableTitle}
        isActionsActive={false}
      />
    </div>
  );
};

export default LocalPriceComparision;
