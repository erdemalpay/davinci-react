import { format, parse } from "date-fns";
import { tr } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
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

        // Tarih formatı granularity'ye göre (backend requirements'a uygun)
        let dateLabel = "";
        const periodGranularity = primaryPeriod.granularity || granularity;

        if (periodGranularity === "daily") {
          const dailyPoint = primaryDataPoint as any;
          // Backend'den gelen date formatı: "2024-12-02"
          // Backend'den gelen label: "Çar" (kısaltılmış gün adı)
          // Tooltip formatı: "04 Ara, Çar" (backend requirements'a göre)
          if (dailyPoint.date) {
            try {
              const date = parse(dailyPoint.date, "yyyy-MM-dd", new Date());
              const dayMonth = format(date, "dd MMM", { locale: tr }); // "04 Ara"
              // Backend'den gelen label'ı kullan (zaten kısaltılmış: "Çar", "Sal", vb.)
              const dayName =
                dailyPoint.label || format(date, "EEE", { locale: tr });
              dateLabel = `${dayMonth}, ${dayName}`;
            } catch {
              // Fallback: Backend'den gelen label'ı kullan
              dateLabel = dailyPoint.label || dailyPoint.date;
            }
          } else {
            dateLabel = dailyPoint.label || "";
          }
        } else if (periodGranularity === "weekly") {
          const weeklyPoint = primaryDataPoint as any;
          // Backend'den gelen format: weekStart ve weekEnd
          // Tooltip'te tarih aralığını göster
          if (weeklyPoint.weekStart && weeklyPoint.weekEnd) {
            try {
              const startDate = parse(
                weeklyPoint.weekStart,
                "yyyy-MM-dd",
                new Date()
              );
              const endDate = parse(
                weeklyPoint.weekEnd,
                "yyyy-MM-dd",
                new Date()
              );
              const startFormatted = format(startDate, "dd MMM", {
                locale: tr,
              });
              const endFormatted = format(endDate, "dd MMM", { locale: tr });
              dateLabel = `${startFormatted} - ${endFormatted}`;
            } catch {
              dateLabel = `${weeklyPoint.weekStart} - ${weeklyPoint.weekEnd}`;
            }
          } else {
            dateLabel = weeklyPoint.label;
          }
        } else {
          // Monthly
          const monthlyPoint = primaryDataPoint as any;
          // Backend'den gelen format: "2024-12" veya label: "Aralık"
          if (monthlyPoint.month) {
            try {
              // "2024-12" formatını parse et
              const date = parse(
                monthlyPoint.month + "-01",
                "yyyy-MM-dd",
                new Date()
              );
              const monthName = format(date, "MMMM", { locale: tr }); // "Aralık"
              dateLabel = monthName;
            } catch {
              dateLabel = monthlyPoint.month || monthlyPoint.label;
            }
          } else {
            dateLabel = monthlyPoint.label;
          }
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

        return `
          <div style="padding: 10px; background: #1f2937; border-radius: 4px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #fff;">
              ${dateLabel}
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 10px; height: 10px; background: #8B5CF6; border-radius: 50%;"></div>
                <span style="color: #d1d5db;">${primaryPeriod.label}:</span>
                <span style="color: #fff; font-weight: 600;">${formatPrice(
                  primaryValue
                )}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 10px; height: 10px; background: #FB923C; border-radius: 50%;"></div>
                <span style="color: #d1d5db;">${secondaryPeriod.label}:</span>
                <span style="color: #fff; font-weight: 600;">${formatPrice(
                  secondaryValue
                )}</span>
              </div>
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

  useEffect(() => {
    if (!compareData) return;

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

    setChartConfig((prevConfig: any) => ({
      ...prevConfig,
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
        ...prevConfig.options,
        xaxis: {
          ...prevConfig.options.xaxis,
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
    }));
  }, [compareData, granularity, customTooltip]);

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
        chartConfig={chartConfig}
        {...(category ? { selectedCategory: category } : {})}
        {...(upperCategory ? { selectedUpperCategory: upperCategory } : {})}
      />
    </div>
  );
}
