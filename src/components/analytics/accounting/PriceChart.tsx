import { Square3Stack3DIcon } from "@heroicons/react/24/outline";
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
} from "@material-tailwind/react";
import { ResponsiveLine } from "@nivo/line";
import { useMemo } from "react";
import { AccountProduct, MenuCategory, UpperCategory, TURKISHLIRA } from "../../../types";
import { format, parse } from "date-fns";

type Props = {
  chartConfig: any;
  selectedProduct?: AccountProduct;
  selectedCategory?: MenuCategory;
  selectedUpperCategory?: UpperCategory;
};

type TooltipData = {
  primaryPeriod?: any;
  secondaryPeriod?: any;
  granularity?: "daily" | "monthly";
  t?: any;
};

const PriceChart = ({
  chartConfig,
  selectedProduct,
  selectedCategory,
  selectedUpperCategory,
}: Props) => {
  // Nivo için data formatını dönüştür
  const nivoLineData = useMemo(() => {
    if (!chartConfig?.series || !chartConfig?.options?.xaxis?.categories) {
      return [];
    }

    return chartConfig.series.map((serie: any) => ({
      id: serie.name,
      data: chartConfig.options.xaxis.categories.map((category: string, idx: number) => ({
        x: category,
        y: serie.data[idx] || 0,
      })),
    }));
  }, [chartConfig]);

  // Renk paleti
  const colors = chartConfig?.options?.colors || ["#8B5CF6", "#FB923C"];

  // Tooltip data
  const tooltipData: TooltipData | undefined = chartConfig?.tooltipData;

  // Tooltip formatter
  const formatTooltipValue = (value: number) => {
    return `${value.toLocaleString("tr-TR")} ${TURKISHLIRA}`;
  };

  return (
    <Card className="shadow-none">
      <CardHeader
        floated={false}
        shadow={false}
        color="transparent"
        className="flex flex-row gap-4 rounded-none items-center"
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
      </CardHeader>
      <CardBody className="px-2 pb-0">
        <div style={{ height: "240px" }}>
          <ResponsiveLine
              data={nivoLineData}
              margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
              xScale={{ type: "point" }}
              yScale={{
                type: "linear",
                min: "auto",
                max: "auto",
                stacked: false,
              }}
              curve="monotoneX"
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: "",
                legendOffset: 45,
                legendPosition: "middle",
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: "",
                legendOffset: -60,
                legendPosition: "middle",
                format: (value) => value.toLocaleString("tr-TR"),
              }}
              enablePoints={true}
              pointSize={10}
              pointColor={{ theme: "background" }}
              pointBorderWidth={2}
              pointBorderColor={{ from: "serieColor" }}
              enableArea={chartConfig.type === "line"}
              areaOpacity={0.15}
              colors={colors}
              useMesh={true}
              enableSlices="x"
              legends={[
                {
                  anchor: "top-right",
                  direction: "column",
                  justify: false,
                  translateX: 0,
                  translateY: 0,
                  itemsSpacing: 0,
                  itemDirection: "left-to-right",
                  itemWidth: 80,
                  itemHeight: 20,
                  itemOpacity: 0.75,
                  symbolSize: 12,
                  symbolShape: "circle",
                  symbolBorderColor: "rgba(0, 0, 0, .5)",
                },
              ]}
              sliceTooltip={({ slice }) => {
                // Nivo Line'da point.data.x ile index'i bulmamız gerekiyor
                const xValue = slice.points[0].data.x;
                const dataPointIndex = chartConfig?.options?.xaxis?.categories?.indexOf(xValue) ?? -1;

                // Eğer tooltipData varsa (CategorySummaryCompareChart'tan geliyorsa), detaylı tooltip göster
                if (tooltipData?.primaryPeriod && tooltipData?.secondaryPeriod && tooltipData.t && dataPointIndex >= 0) {
                  try {
                    const primaryData = tooltipData.primaryPeriod.data[dataPointIndex];
                    const secondaryData = tooltipData.secondaryPeriod.data[dataPointIndex];
                    const t = tooltipData.t;

                    if (!primaryData || !secondaryData) {
                      // Basit tooltip'e geç
                    } else {

                  const primaryValue = parseFloat(primaryData.total || 0);
                  const secondaryValue = parseFloat(secondaryData.total || 0);
                  const difference = primaryValue - secondaryValue;
                  const percentageChange =
                    secondaryValue !== 0 ? ((difference / secondaryValue) * 100).toFixed(1) : "0";

                  // Tarih formatları
                  const formatDate = (dataItem: any, granularity: string) => {
                    if (granularity === "daily" && dataItem.date) {
                      const date = parse(dataItem.date, "yyyy-MM-dd", new Date());
                      return `${format(date, "dd")} ${t(format(date, "MMM"))} ${format(date, "yyyy")}`;
                    } else if (granularity === "monthly" && dataItem.month) {
                      const date = parse(dataItem.month + "-01", "yyyy-MM-dd", new Date());
                      const monthIndex = date.getMonth();
                      const monthKeys = [
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                      ];
                      return `${t(monthKeys[monthIndex])} ${format(date, "yyyy")}`;
                    }
                    return "";
                  };

                  const primaryDateLabel = formatDate(primaryData, tooltipData.granularity || "daily");
                  const secondaryDateLabel = formatDate(secondaryData, tooltipData.granularity || "daily");

                  return (
                    <div
                      style={{
                        background: "#1f2937",
                        color: "#fff",
                        padding: "12px",
                        borderRadius: "6px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
                        minWidth: "240px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          marginBottom: "10px",
                          color: "#fff",
                          fontSize: "14px",
                          borderBottom: "1px solid #374151",
                          paddingBottom: "8px",
                        }}
                      >
                        {slice.points[0].data.xFormatted}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {/* Primary Period */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div
                              style={{
                                width: "12px",
                                height: "12px",
                                background: colors[0],
                                borderRadius: "2px",
                              }}
                            />
                            <span style={{ color: "#9ca3af", fontSize: "11px", fontWeight: 500 }}>
                              {primaryDateLabel}
                            </span>
                          </div>
                          <span
                            style={{
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: "16px",
                              marginLeft: "18px",
                            }}
                          >
                            {formatTooltipValue(primaryValue)}
                          </span>
                        </div>

                        {/* Secondary Period */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div
                              style={{
                                width: "12px",
                                height: "12px",
                                background: colors[1],
                                borderRadius: "2px",
                              }}
                            />
                            <span style={{ color: "#9ca3af", fontSize: "11px", fontWeight: 500 }}>
                              {secondaryDateLabel}
                            </span>
                          </div>
                          <span
                            style={{
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: "16px",
                              marginLeft: "18px",
                            }}
                          >
                            {formatTooltipValue(secondaryValue)}
                          </span>
                        </div>

                        {/* Difference */}
                        {difference !== 0 && (
                          <div
                            style={{
                              marginTop: "4px",
                              paddingTop: "8px",
                              borderTop: "1px solid #374151",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span style={{ color: "#9ca3af", fontSize: "11px" }}>Fark:</span>
                              <div style={{ textAlign: "right" }}>
                                <div
                                  style={{
                                    color: difference > 0 ? "#10b981" : "#ef4444",
                                    fontWeight: 700,
                                    fontSize: "14px",
                                  }}
                                >
                                  {difference > 0 ? "+" : ""}
                                  {formatTooltipValue(Math.abs(difference))}
                                </div>
                                <div
                                  style={{
                                    color: difference > 0 ? "#10b981" : "#ef4444",
                                    fontSize: "11px",
                                  }}
                                >
                                  ({parseFloat(percentageChange) > 0 ? "+" : ""}
                                  {percentageChange}%)
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                    }
                  } catch (error) {
                    // Hata durumunda basit tooltip'e geç
                  }
                }

                // Basit tooltip (CategorySummaryChart için)
                return (
                  <div
                    style={{
                      background: "#1f2937",
                      color: "#fff",
                      padding: "12px",
                      borderRadius: "6px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
                      minWidth: "200px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        marginBottom: "10px",
                        color: "#fff",
                        fontSize: "14px",
                        borderBottom: "1px solid #374151",
                        paddingBottom: "8px",
                      }}
                    >
                      {slice.points[0].data.xFormatted}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {slice.points.map((point) => (
                        <div
                          key={point.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div
                              style={{
                                width: "12px",
                                height: "12px",
                                background: point.seriesColor,
                                borderRadius: "2px",
                              }}
                            />
                            <span style={{ color: "#9ca3af", fontSize: "12px" }}>
                              {point.seriesId}
                            </span>
                          </div>
                          <strong style={{ color: "#fff", fontSize: "14px", marginLeft: "12px" }}>
                            {formatTooltipValue(point.data.y as number)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }}
              theme={{
                axis: {
                  ticks: {
                    text: {
                      fill: "#616161",
                      fontSize: 12,
                      fontFamily: "inherit",
                    },
                  },
                },
                grid: {
                  line: {
                    stroke: "#dddddd",
                    strokeDasharray: "5 5",
                  },
                },
              }}
            />
        </div>
      </CardBody>
    </Card>
  );
};

export default PriceChart;
