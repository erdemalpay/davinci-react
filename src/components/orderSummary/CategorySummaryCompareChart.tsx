import { format, parse } from "date-fns";
import { tr } from "date-fns/locale";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DailyData,
  MenuCategory,
  MonthlyData,
  TURKISHLIRA,
  UpperCategory,
} from "../../types";
import { useGetCategorySummaryCompare } from "../../utils/api/order/order";
import {
  calculatePreviousPeriod,
  estimateGranularity,
} from "../../utils/dateUtil";
import PriceChart from "../analytics/accounting/PriceChart";

// Type guard functions
function isDailyData(data: any): data is DailyData {
  return data && typeof data.date === "string";
}

function isMonthlyData(data: any): data is MonthlyData {
  return data && typeof data.month === "string";
}

// Helper: Label generation functions
function getDayLabel(dateStr: string, t: any): string {
  const date = parse(dateStr, "yyyy-MM-dd", new Date());
  const dayIndex = date.getDay();
  const dayKeys = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return t(dayKeys[dayIndex]);
}

function getMonthLabel(monthStr: string, t: any): string {
  const date = parse(monthStr + "-01", "yyyy-MM-dd", new Date());
  const monthIndex = date.getMonth();
  const monthKeys = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return t(monthKeys[monthIndex]);
}

function formatPeriodLabel(start: string, end: string, granularity: "daily" | "monthly", t: any): string {
  const startDate = parse(start, "yyyy-MM-dd", new Date());
  const endDate = parse(end, "yyyy-MM-dd", new Date());

  if (granularity === "daily") {
    return `${format(startDate, "dd")} ${t(format(startDate, "MMM"))} - ${format(endDate, "dd")} ${t(format(endDate, "MMM"))}`;
  } else {
    return `${format(startDate, "dd")} ${t(format(startDate, "MMM"))} ${format(startDate, "yyyy")} - ${format(endDate, "dd")} ${t(format(endDate, "MMM"))} ${format(endDate, "yyyy")}`;
  }
}

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

  const [chartConfig] = useState<any>({
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
          formatter: (value: number) =>
            `${value.toLocaleString("tr-TR")} ${TURKISHLIRA}`,
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

    // X ekseni kategorileri (label'ları frontend'de oluştur)
    const categories = primaryPeriod.data.map((item: any) => {
      if (isDailyData(item)) {
        return getDayLabel(item.date, t);
      } else if (isMonthlyData(item)) {
        return getMonthLabel(item.month, t);
      }
      return "";
    });

    // Y ekseni değerleri
    const primaryValues = primaryPeriod.data.map((item: any) =>
      parseFloat(item.total.toFixed(2))
    );
    const secondaryValues = secondaryPeriod.data.map((item: any) =>
      parseFloat(item.total.toFixed(2))
    );

    // Period label'ları oluştur
    const primaryLabel = formatPeriodLabel(primaryPeriod.startDate, primaryPeriod.endDate, primaryPeriod.granularity, t);
    const secondaryLabel = formatPeriodLabel(secondaryPeriod.startDate, secondaryPeriod.endDate, secondaryPeriod.granularity, t);

    return {
      ...chartConfig,
      series: [
        {
          name: primaryLabel,
          data: primaryValues,
        },
        {
          name: secondaryLabel,
          data: secondaryValues,
        },
      ],
      options: {
        ...chartConfig.options,
        xaxis: {
          ...chartConfig.options.xaxis,
          categories: categories,
        },
      },
      // Nivo için tooltip metadata
      tooltipData: {
        primaryPeriod,
        secondaryPeriod,
        granularity,
        t,
      },
    };
  }, [compareData, granularity, chartConfig, t]);

  // Secondary period label - MUST be before any early returns
  const secondaryPeriodLabel = useMemo(() => {
    if (!compareData?.secondaryPeriod) return "";
    return formatPeriodLabel(
      compareData.secondaryPeriod.startDate,
      compareData.secondaryPeriod.endDate,
      compareData.secondaryPeriod.granularity,
      t
    );
  }, [compareData, t]);

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
          {t("Compare Period")} {secondaryPeriodLabel}
        </span>
        <span className="text-sm font-semibold text-green-600">
          {compareData.comparisonMetrics.percentageChange > 0 ? "+" : ""}
          {compareData.comparisonMetrics.percentageChange.toFixed(2)}%
        </span>
        <span className="text-sm text-gray-500">
          ({compareData.comparisonMetrics.absoluteChange > 0 ? "+" : ""}
          {Math.abs(
            compareData.comparisonMetrics.absoluteChange
          ).toLocaleString("tr-TR")}{" "}
          {TURKISHLIRA})
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
