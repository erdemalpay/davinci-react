import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Location } from "../types";

type UseStockLocationExcelProps = {
  rows: any[];
  locations: Location[];
  isLocationFilterActive: boolean;
};

export const useStockLocationExcel = ({
  rows,
  locations,
  isLocationFilterActive,
}: UseStockLocationExcelProps) => {
  const { t } = useTranslation();

  const excelColumns = useMemo(() => {
    if (isLocationFilterActive) return undefined;
    return [
      { key: t("Product"), correspondingKey: "prdct" },
      { key: t("Sku"), correspondingKey: "sku" },
      { key: t("Barcode"), correspondingKey: "barcode" },
      ...[...locations]
        .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
        .map((location) => ({
          key: location.name,
          correspondingKey: `location_${location._id}`,
        })),
    ];
  }, [isLocationFilterActive, locations, t]);

  const excelRows = useMemo(() => {
    if (isLocationFilterActive) return undefined;
    return rows.map((row: any) => {
      const locationQuantities: Record<string, number> = {};
      (row?.collapsible?.collapsibleRows ?? []).forEach((cRow: any) => {
        if (cRow?.stockLocation == null) return;
        const locationKey = `location_${cRow.stockLocation}`;
        locationQuantities[locationKey] =
          (locationQuantities[locationKey] ?? 0) + (cRow?.quantity ?? 0);
      });
      return {
        prdct: row?.prdct,
        sku: row?.sku,
        barcode: row?.barcode,
        ...locationQuantities,
      };
    });
  }, [isLocationFilterActive, rows]);

  return { excelRows, excelColumns };
};
