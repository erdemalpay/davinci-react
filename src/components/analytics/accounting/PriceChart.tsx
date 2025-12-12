import { Square3Stack3DIcon } from "@heroicons/react/24/outline";
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Switch,
} from "@material-tailwind/react";
import Chart from "react-apexcharts";
import { useEffect, useRef, useState } from "react";
import { AccountProduct, MenuCategory, UpperCategory } from "../../../types";

type Props = {
  chartConfig: any;
  selectedProduct?: AccountProduct;
  selectedCategory?: MenuCategory;
  selectedUpperCategory?: UpperCategory;
};

type RadarTooltipRow = {
  name: string;
  color: string;
  value: string | number;
};

type RadarTooltipState = {
  visible: boolean;
  x: number;
  y: number;
  label: string;
  rows: RadarTooltipRow[];
};

const PriceChart = ({
  chartConfig,
  selectedProduct,
  selectedCategory,
  selectedUpperCategory,
}: Props) => {
  const [isRadarChart, setIsRadarChart] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [radarTooltip, setRadarTooltip] = useState<RadarTooltipState>({
    visible: false,
    x: 0,
    y: 0,
    label: "",
    rows: [],
  });

  useEffect(() => {
    if (!isRadarChart && radarTooltip.visible) {
      setRadarTooltip((prev) => ({
        visible: false,
        x: prev.x,
        y: prev.y,
        label: "",
        rows: [],
      }));
    }
  }, [isRadarChart, radarTooltip.visible]);

  // SVG üzerinde manuel event listener ekle
  useEffect(() => {
    if (!isRadarChart || !chartContainerRef.current) {
      return;
    }

    const container = chartContainerRef.current;
    const checkAndAttachListeners = () => {
      const svgElement = container.querySelector('svg');
      if (!svgElement) {
        return;
      }

      const markers = svgElement.querySelectorAll('.apexcharts-marker');
      const seriesCount = chartConfig?.series?.length || 1;
      console.log('📍 Found markers:', markers.length, 'seriesCount:', seriesCount);

      markers.forEach((marker, index) => {
        const handleMouseEnter = (e: Event) => {
          console.log('🎯 Marker hover detected', index);
          const categories = Array.isArray(chartConfig?.options?.xaxis?.categories)
            ? (chartConfig.options.xaxis.categories as string[])
            : [];
          const tooltipOptions = chartConfig?.options?.tooltip || {};

          // Her serinin kendi marker'ları var, index'i kategoriye çevir
          const dataPointIndex = Math.floor(index / seriesCount);
          console.log('📊 Calculated dataPointIndex:', dataPointIndex, 'for marker index:', index);

          handleRadarPointHover(
            e as any,
            { opts: chartConfig?.options, w: { globals: { colors: chartConfig?.options?.colors } } },
            { dataPointIndex },
            categories,
            tooltipOptions,
            chartConfig
          );
        };

        const handleMouseLeave = () => {
          console.log('👋 Marker leave detected', index);
          hideRadarTooltip();
        };

        marker.addEventListener('mouseenter', handleMouseEnter);
        marker.addEventListener('mouseleave', handleMouseLeave);
      });
    };

    // Chart render olduktan sonra listener'ları ekle
    const timeoutId = setTimeout(checkAndAttachListeners, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isRadarChart, chartConfig]);

  const getValueFormatter = (tooltipOptions: any, seriesIndex: number) => {
    const tooltipY = tooltipOptions?.y;
    if (Array.isArray(tooltipY)) {
      return tooltipY?.[seriesIndex]?.formatter;
    }
    return tooltipY?.formatter;
  };

  const hideRadarTooltip = () => {
    setRadarTooltip((prev) =>
      prev.visible
        ? {
            visible: false,
            x: prev.x,
            y: prev.y,
            label: "",
            rows: [],
          }
        : prev
    );
  };

  const handleRadarPointHover = (
    event: any,
    chartContext: any,
    config: any,
    categories: string[],
    tooltipOptions: any,
    sourceChartConfig?: any
  ) => {
    console.log("🎯 handleRadarPointHover triggered", { event, config, dataPointIndex: config?.dataPointIndex });
    const container = chartContainerRef.current;
    if (!container || typeof config?.dataPointIndex !== "number") {
      console.log("❌ Early return", { container: !!container, dataPointIndex: config?.dataPointIndex });
      return;
    }
    const dataPointIndex = config.dataPointIndex;
    const label =
      categories?.[dataPointIndex] ??
      chartContext?.opts?.xaxis?.categories?.[dataPointIndex] ??
      "";

    console.log('🔍 Processing data:', { dataPointIndex, label, categories, series: sourceChartConfig?.series });

    // chartConfig.series'den data'yı al
    const series = sourceChartConfig?.series || chartContext?.opts?.series || [];
    const rows =
      series
        ?.map((serie: any, idx: number) => {
          const value = serie?.data?.[dataPointIndex];
          console.log(`  Series ${idx} (${serie?.name}):`, value);
          if (typeof value === "undefined" || value === null) {
            return null;
          }
          const formatter = getValueFormatter(tooltipOptions, idx);
          const formattedValue =
            typeof formatter === "function"
              ? formatter(value, {
                  seriesIndex: idx,
                  dataPointIndex,
                  w: chartContext?.w,
                })
              : typeof value === "number"
              ? value.toLocaleString("tr-TR")
              : value;
          const color =
            chartContext?.w?.globals?.colors?.[idx] ||
            sourceChartConfig?.options?.colors?.[idx] ||
            "#6B7280";
          const name = serie?.name ?? `Series ${idx + 1}`;
          return {
            name,
            color,
            value: formattedValue,
          };
        })
        .filter(Boolean) ?? [];

    const bounds = container.getBoundingClientRect();
    const mouseEvent = event as MouseEvent;
    const mouseX = mouseEvent?.clientX ?? 0;
    const mouseY = mouseEvent?.clientY ?? 0;
    const relativeX = mouseX - bounds.left;
    const relativeY = mouseY - bounds.top;

    const newTooltipState = {
      visible: true,
      x: relativeX,
      y: relativeY,
      label,
      rows: rows as RadarTooltipRow[],
    };
    console.log("✅ Setting tooltip state", newTooltipState);
    setRadarTooltip(newTooltipState);
  };

  const getRadarTooltipStyle = () => {
    const padding = 12;
    const tooltipWidth = 220;
    const rowHeight = 22;
    const tooltipHeight =
      48 + radarTooltip.rows.length * rowHeight;
    const container = chartContainerRef.current;
    let left = radarTooltip.x + padding;
    let top = radarTooltip.y + padding;

    if (container) {
      if (left + tooltipWidth > container.clientWidth) {
        left = radarTooltip.x - tooltipWidth - padding;
      }
      if (left < 0) {
        left = padding;
      }

      if (top + tooltipHeight > container.clientHeight) {
        top = radarTooltip.y - tooltipHeight - padding;
      }
      if (top < 0) {
        top = padding;
      }
    }

    return {
      left,
      top,
      width: tooltipWidth,
    };
  };

  // Radar chart için konfigürasyonu dönüştür
  const getRadarConfig = () => {
    const categories = Array.isArray(
      chartConfig?.options?.xaxis?.categories
    )
      ? (chartConfig.options.xaxis.categories as string[])
      : [];
    const tooltipOptions = chartConfig?.options?.tooltip || {};
    const radarShared =
      typeof tooltipOptions.shared === "boolean"
        ? tooltipOptions.shared
        : true;
    const radarIntersect =
      typeof tooltipOptions.intersect === "boolean"
        ? tooltipOptions.intersect
        : false;
    const radarFollowCursor =
      typeof tooltipOptions.followCursor === "boolean"
        ? tooltipOptions.followCursor
        : true;
    const baseChartEvents = chartConfig?.options?.chart?.events || {};
    const radarEvents = {
      ...baseChartEvents,
      dataPointMouseEnter: (event: any, chartCtx: any, config: any) => {
        if (typeof baseChartEvents.dataPointMouseEnter === "function") {
          baseChartEvents.dataPointMouseEnter(event, chartCtx, config);
        }
        handleRadarPointHover(
          event?.detail?.event ?? event,
          chartCtx,
          config,
          categories,
          tooltipOptions,
          chartConfig
        );
      },
      dataPointMouseLeave: (event: any, chartCtx: any, config: any) => {
        if (typeof baseChartEvents.dataPointMouseLeave === "function") {
          baseChartEvents.dataPointMouseLeave(event, chartCtx, config);
        }
        hideRadarTooltip();
      },
    };

    return {
      ...chartConfig,
      type: "radar",
      height: 400, // Radar için daha yüksek grafik
      options: {
        ...chartConfig.options,
        labels: categories,
        chart: {
          ...chartConfig.options?.chart,
          type: "radar",
          toolbar: {
            show: false,
          },
          dropShadow: {
            enabled: false,
          },
          selection: {
            enabled: false, // Tıklama-sürükleme seçimini devre dışı bırak
          },
          zoom: {
            enabled: false, // Zoom'u devre dışı bırak
          },
          events: radarEvents,
        },
        xaxis: {
          ...chartConfig.options?.xaxis,
          labels: {
            ...chartConfig.options?.xaxis?.labels,
            style: {
              colors: Array.isArray(chartConfig.options?.xaxis?.categories)
                ? chartConfig.options.xaxis.categories.map(() => "#616161")
                : [],
              fontSize: "12px",
              fontFamily: "inherit",
              fontWeight: 400,
            },
          },
          crosshairs: {
            show: false, // Dikey çizgi ve label'ları kapat
          },
        },
        yaxis: {
          ...chartConfig.options?.yaxis,
          show: false, // Radar için sayısal değerleri gizle
        },
        grid: {
          show: false, // Radar için grid'i kapat
        },
        plotOptions: {
          radar: {
            size: undefined, // Auto-size ile grafiğin kesilmesini engelle
            polygons: {
              strokeColors: "#e9e9e9",
              fill: {
                colors: ["#f8f8f8", "#fff"],
              },
            },
          },
        },
        markers: {
          size: 6, // Radar için marker'ları biraz büyült
          colors: chartConfig.options?.colors || ["#8B5CF6", "#FB923C"],
          strokeColors: "#fff",
          strokeWidth: 2,
          hover: {
            size: 10, // Hover'da daha da büyüt
            sizeOffset: 3,
          },
          discrete: [],
        },
        fill: {
          opacity: 0.25,
        },
        dataLabels: {
          enabled: false,
        },
        legend: {
          show: true,
          position: "top",
          horizontalAlign: "right",
        },
        tooltip: {
          ...tooltipOptions,
          enabled: false,
          shared: radarShared,
          intersect: radarIntersect,
          followCursor: radarFollowCursor,
        },
        stroke: {
          show: true,
          width: 2,
          curve: 'straight',
        },
        states: {
          hover: {
            filter: {
              type: "lighten",
              value: 0.15,
            },
          },
          active: {
            filter: {
              type: "darken",
              value: 0.15,
            },
          },
        },
      },
    };
  };

  const displayConfig = isRadarChart ? getRadarConfig() : chartConfig;

  console.log("🔄 Render - isRadarChart:", isRadarChart, "tooltip:", radarTooltip);

  return (
    <Card className="shadow-none">
      <CardHeader
        floated={false}
        shadow={false}
        color="transparent"
        className="flex flex-row gap-4 rounded-none  items-center justify-between"
      >
        <div className="flex flex-row gap-4 items-center">
          <div className="w-max rounded-lg bg-gray-900 p-5 text-white">
            <Square3Stack3DIcon className="h-6 w-6" />
          </div>
          <div>
            <Typography variant="h6" color="blue-gray">
              {selectedProduct && selectedProduct?.name}
              {selectedCategory && selectedCategory?.name}
              {selectedUpperCategory && selectedUpperCategory?.name}
            </Typography>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Typography variant="small" color="blue-gray">
            Çizgi
          </Typography>
          <Switch
            checked={isRadarChart}
            onChange={() => setIsRadarChart(!isRadarChart)}
            crossOrigin={undefined}
          />
          <Typography variant="small" color="blue-gray">
            Radar
          </Typography>
        </div>
      </CardHeader>
      <CardBody className={isRadarChart ? "px-2 py-8" : "px-2 pb-0"}>
        <div ref={chartContainerRef} className="relative" style={{ position: 'relative', zIndex: 1 }}>
          <Chart {...(displayConfig as any)} />
          {isRadarChart && radarTooltip.visible && radarTooltip.rows.length > 0 && (
            <div
              className="pointer-events-none absolute rounded-lg bg-gray-900/95 px-3 py-2 text-xs text-gray-100 shadow-2xl backdrop-blur border border-gray-700"
              style={{ ...getRadarTooltipStyle(), zIndex: 9999 }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-200">
                {radarTooltip.label}
              </div>
              <div className="mt-2 flex flex-col gap-1">
                {radarTooltip.rows.map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="text-[11px] text-gray-300">
                        {row.name}
                      </span>
                    </div>
                    <span className="text-[12px] font-semibold text-gray-50">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default PriceChart;
