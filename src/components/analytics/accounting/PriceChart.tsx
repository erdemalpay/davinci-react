import { Square3Stack3DIcon } from "@heroicons/react/24/outline";
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Switch,
} from "@material-tailwind/react";
import Chart from "react-apexcharts";
import { useState } from "react";
import { AccountProduct, MenuCategory, UpperCategory } from "../../../types";

type Props = {
  chartConfig: any;
  selectedProduct?: AccountProduct;
  selectedCategory?: MenuCategory;
  selectedUpperCategory?: UpperCategory;
};

const PriceChart = ({
  chartConfig,
  selectedProduct,
  selectedCategory,
  selectedUpperCategory,
}: Props) => {
  const [isRadarChart, setIsRadarChart] = useState(false);

  // Radar chart için konfigürasyonu dönüştür
  const getRadarConfig = () => {
    return {
      ...chartConfig,
      type: "radar",
      height: 400, // Radar için daha yüksek grafik
      options: {
        ...chartConfig.options,
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
          events: {
            ...chartConfig.options?.chart?.events,
          },
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
            size: 8, // Hover'da daha da büyüt
            sizeOffset: 3,
          },
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
          enabled: true,
          shared: true,
          custom: chartConfig.options?.tooltip?.custom,
        },
        stroke: {
          show: true,
          width: 2,
        },
        states: {
          hover: {
            filter: {
              type: "none", // Hover efektlerini devre dışı bırak
            },
          },
          active: {
            filter: {
              type: "none",
            },
          },
        },
      },
    };
  };

  const displayConfig = isRadarChart ? getRadarConfig() : chartConfig;

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
        <Chart {...(displayConfig as any)} />
      </CardBody>
    </Card>
  );
};

export default PriceChart;
