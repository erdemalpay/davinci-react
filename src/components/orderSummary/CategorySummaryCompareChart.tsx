import { format, parse } from "date-fns";
import { tr } from "date-fns/locale";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MenuCategory, UpperCategory } from "../../types";
import { useGetCategorySummaryCompare } from "../../utils/api/order/order";
import {
  calculatePreviousPeriod,
  estimateGranularity,
} from "../../utils/dateUtil";
import { formatPrice } from "../../utils/formatPrice";
import PriceChart from "../analytics/accounting/PriceChart";

type Props = {
  location?: number;
  category?: MenuCategory;
  upperCategory?: UpperCategory;
  primaryAfter: string;
  primaryBefore: string;
};

export default function CategorySummaryCompareChart({
  location,
  category,
  upperCategory,
  primaryAfter,
  primaryBefore,
}: Props) {
  const { t } = useTranslation();

  // Önceki dönemi hesapla
  const { secondaryAfter, secondaryBefore } = calculatePreviousPeriod(
    primaryAfter,
    primaryBefore
  );

  // Granularity tahmini (backend zaten belirliyor ama başlangıç için)
  const estimatedGranularity = estimateGranularity(primaryAfter, primaryBefore);

  const compareData = useGetCategorySummaryCompare(
    primaryAfter,
    primaryBefore,
    secondaryAfter,
    secondaryBefore,
    estimatedGranularity,
    location || 0,
    upperCategory?._id,
    category?._id
  );

  // Backend'den gelen granularity'yi kullan (eğer varsa)
  const granularity =
    compareData?.primaryPeriod?.granularity || estimatedGranularity;

  // Tooltip custom fonksiyonu - useMemo ile memoize et
  const customTooltip = useMemo(() => {
    if (!compareData) {
      return ({ series, seriesIndex, dataPointIndex, w }: any) => "";
    }

    return ({ series, seriesIndex, dataPointIndex, w }: any) => {
      try {
        const primaryPeriod = compareData.primaryPeriod;
        const secondaryPeriod = compareData.secondaryPeriod;

        // Data point bilgilerini al
        const primaryDataPoint = primaryPeriod.data[dataPointIndex];
        const secondaryDataPoint = secondaryPeriod.data[dataPointIndex];

        if (!primaryDataPoint || !secondaryDataPoint) {
          return "";
        }

        // X ekseni label'ını al (grafikte gösterilen kısa label)
        // Bu sadece kısa gösterim için: "Mayıs", "Pzt", "Hafta 1" gibi
        let xAxisLabel = "";
        if (w?.config?.xaxis?.categories?.[dataPointIndex]) {
          xAxisLabel = w.config.xaxis.categories[dataPointIndex];
        } else {
          xAxisLabel = primaryDataPoint.label || "";
        }

        // Tooltip için detaylı tarih bilgisi - sadece referans için göster
        const periodGranularity = primaryPeriod.granularity || granularity;
        let detailedDateInfo = "";

        if (periodGranularity === "monthly" && primaryDataPoint.month) {
          try {
            // Aylık: Sadece ay ismini göster (yıl gereksiz, zaten dönem label'ında var)
            const date = parse(
              primaryDataPoint.month + "-01",
              "yyyy-MM-dd",
              new Date()
            );
            detailedDateInfo = format(date, "MMMM", { locale: tr }); // "Mayıs"
          } catch {
            detailedDateInfo = primaryDataPoint.label || primaryDataPoint.month;
          }
        } else if (periodGranularity === "daily" && primaryDataPoint.date) {
          try {
            // Günlük: Kısa tarih formatı
            const date = parse(primaryDataPoint.date, "yyyy-MM-dd", new Date());
            detailedDateInfo = format(date, "dd MMM, EEEE", { locale: tr }); // "11 Ara, Perşembe"
          } catch {
            detailedDateInfo = primaryDataPoint.label || primaryDataPoint.date;
          }
        } else {
          detailedDateInfo = xAxisLabel;
        }

        // Series değerlerini al
        // ApexCharts'ta shared tooltip kullanırken series yapısı: [[val1, val2, ...], [val1, val2, ...]]
        const primaryValue =
          series && series[0]
            ? series[0][dataPointIndex] ?? primaryDataPoint.total ?? 0
            : primaryDataPoint.total ?? 0;
        const secondaryValue =
          series && series[1]
            ? series[1][dataPointIndex] ?? secondaryDataPoint.total ?? 0
            : secondaryDataPoint.total ?? 0;

        // Fark hesapla (isteğe bağlı gösterim için)
        const difference = primaryValue - secondaryValue;
        const percentageChangeNum =
          secondaryValue !== 0 ? (difference / secondaryValue) * 100 : 0;
        const percentageChange = percentageChangeNum.toFixed(1);

        // Her dönem için spesifik tarih bilgisi oluştur
        let primaryDateLabel = "";
        let secondaryDateLabel = "";

        if (periodGranularity === "daily") {
          // Günlük için: tarih bilgisi
          if (primaryDataPoint.date) {
            try {
              const date = parse(
                primaryDataPoint.date,
                "yyyy-MM-dd",
                new Date()
              );
              primaryDateLabel = format(date, "dd MMM", { locale: tr });
            } catch {
              primaryDateLabel = primaryDataPoint.date;
            }
          }
          if (secondaryDataPoint.date) {
            try {
              const date = parse(
                secondaryDataPoint.date,
                "yyyy-MM-dd",
                new Date()
              );
              secondaryDateLabel = format(date, "dd MMM", { locale: tr });
            } catch {
              secondaryDateLabel = secondaryDataPoint.date;
            }
          }
        } else if (periodGranularity === "monthly") {
          // Aylık için: ay adı
          if (primaryDataPoint.month) {
            try {
              const date = parse(
                primaryDataPoint.month + "-01",
                "yyyy-MM-dd",
                new Date()
              );
              primaryDateLabel = format(date, "MMMM", { locale: tr });
            } catch {
              primaryDateLabel = primaryDataPoint.month;
            }
          }
          if (secondaryDataPoint.month) {
            try {
              const date = parse(
                secondaryDataPoint.month + "-01",
                "yyyy-MM-dd",
                new Date()
              );
              secondaryDateLabel = format(date, "MMMM", { locale: tr });
            } catch {
              secondaryDateLabel = secondaryDataPoint.month;
            }
          }
        }

        return `
          <div style="padding: 12px; background: #1f2937; border-radius: 6px; min-width: 240px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
            <!-- Tarih Başlığı -->
            <div style="font-weight: 700; margin-bottom: 10px; color: #fff; font-size: 14px; border-bottom: 1px solid #374151; padding-bottom: 8px;">
              ${detailedDateInfo}
            </div>
            
            <!-- Değerler -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <!-- Primary Period (Mor - Seçili Dönem) -->
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <div style="width: 12px; height: 12px; background: #8B5CF6; border-radius: 2px;"></div>
                  <span style="color: #9ca3af; font-size: 11px; font-weight: 500;">${
                    primaryDateLabel || primaryPeriod.label
                  }</span>
                </div>
                <span style="color: #fff; font-weight: 700; font-size: 16px; margin-left: 18px;">${formatPrice(
                  primaryValue
                )}</span>
              </div>
              
              <!-- Secondary Period (Turuncu - Karşılaştırma Dönemi) -->
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <div style="width: 12px; height: 12px; background: #FB923C; border-radius: 2px;"></div>
                  <span style="color: #9ca3af; font-size: 11px; font-weight: 500;">${
                    secondaryDateLabel || secondaryPeriod.label
                  }</span>
                </div>
                <span style="color: #fff; font-weight: 700; font-size: 16px; margin-left: 18px;">${formatPrice(
                  secondaryValue
                )}</span>
              </div>
              
              <!-- Fark Gösterimi (sadece 0 değilse) -->
              ${
                difference !== 0
                  ? `
              <div style="margin-top: 4px; padding-top: 8px; border-top: 1px solid #374151;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #9ca3af; font-size: 11px;">Fark:</span>
                  <div style="text-align: right;">
                    <div style="color: ${
                      difference > 0 ? "#10b981" : "#ef4444"
                    }; font-weight: 700; font-size: 14px;">
                      ${difference > 0 ? "+" : ""}${formatPrice(difference)}
                    </div>
                    <div style="color: ${
                      difference > 0 ? "#10b981" : "#ef4444"
                    }; font-size: 11px;">
                      (${
                        percentageChangeNum > 0 ? "+" : ""
                      }${percentageChange}%)
                    </div>
                  </div>
                </div>
              </div>
              `
                  : ""
              }
            </div>
          </div>
        `;
      } catch (error) {
        console.error("Tooltip error:", error);
        return "";
      }
    };
  }, [compareData, granularity]);

  const [chartConfig, setChartConfig] = useState<any>({
    height: 240,
    type: "line",
    series: [
      {
        name: "Current Period",
        data: [],
      },
      {
        name: "Previous Period",
        data: [],
      },
    ],
    options: {
      chart: {
        toolbar: {
          show: false,
        },
      },
      title: {
        show: false,
      },
      dataLabels: {
        enabled: false,
      },
      colors: ["#8B5CF6", "#FB923C"], // Mor ve turuncu
      stroke: {
        curve: "smooth",
        width: 2,
      },
      xaxis: {
        axisTicks: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
        labels: {
          style: {
            colors: "#616161",
            fontSize: "12px",
            fontFamily: "inherit",
            fontWeight: 400,
          },
        },
        categories: [],
      },
      yaxis: {
        labels: {
          style: {
            colors: "#616161",
            fontSize: "12px",
            fontFamily: "inherit",
            fontWeight: 400,
          },
          formatter: (value: number) => formatPrice(value),
        },
      },
      grid: {
        show: true,
        borderColor: "#dddddd",
        strokeDashArray: 5,
        xaxis: {
          lines: {
            show: true,
          },
        },
        padding: {
          top: 5,
          right: 20,
        },
      },
      fill: {
        opacity: 0.8,
      },
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
        followCursor: true,
        theme: "dark",
      },
      legend: {
        show: true,
        position: "top",
        horizontalAlign: "right",
        markers: {
          width: 10,
          height: 10,
          radius: 5,
        },
      },
    },
  });

  // Chart config'i useMemo ile oluştur - useEffect + setState sonsuz döngüye sebep oluyordu
  const finalChartConfig = useMemo(() => {
    if (
      !compareData?.primaryPeriod?.data ||
      !compareData?.secondaryPeriod?.data
    ) {
      return chartConfig; // İlk config'i döndür
    }

    const primaryPeriod = compareData.primaryPeriod;
    const secondaryPeriod = compareData.secondaryPeriod;

    // X ekseni kategorileri (label'lar)
    const categories = primaryPeriod.data.map((item: any) => item.label);

    // Y ekseni değerleri
    const primaryValues = primaryPeriod.data.map((item: any) =>
      parseFloat(item.total.toFixed(2))
    );
    const secondaryValues = secondaryPeriod.data.map((item: any) =>
      parseFloat(item.total.toFixed(2))
    );

    return {
      ...chartConfig,
      series: [
        {
          name: primaryPeriod.label,
          data: primaryValues,
        },
        {
          name: secondaryPeriod.label,
          data: secondaryValues,
        },
      ],
      options: {
        ...chartConfig.options,
        xaxis: {
          ...chartConfig.options.xaxis,
          categories: categories,
        },
        tooltip: {
          enabled: true,
          shared: true,
          intersect: false,
          followCursor: false,
          theme: "dark",
          custom: customTooltip,
          style: {
            fontSize: "12px",
            fontFamily: "inherit",
          },
        },
      },
    };
  }, [compareData, granularity, customTooltip, chartConfig]);

  if (!compareData) {
    return (
      <div className="flex flex-col gap-4 mx-auto w-full">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">{t("Loading...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mx-auto w-full">
      {/* Karşılaştırma metrikleri */}
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-sm text-gray-600">
          {t("Compare Period")} {compareData.secondaryPeriod.label}
        </span>
        <span className="text-sm font-semibold text-green-600">
          {compareData.comparisonMetrics.percentageChange > 0 ? "+" : ""}
          {compareData.comparisonMetrics.percentageChange.toFixed(2)}%
        </span>
        <span className="text-sm text-gray-500">
          ({compareData.comparisonMetrics.absoluteChange > 0 ? "+" : ""}
          {formatPrice(compareData.comparisonMetrics.absoluteChange)})
        </span>
      </div>
      <PriceChart
        chartConfig={finalChartConfig}
        {...(category ? { selectedCategory: category } : {})}
        {...(upperCategory ? { selectedUpperCategory: upperCategory } : {})}
      />
    </div>
  );
}
