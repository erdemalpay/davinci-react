import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MenuCategory } from "../../types";
import { useGetCategorySummary } from "../../utils/api/order/order";
import PriceChart from "../analytics/accounting/PriceChart";

type Props = {
  location?: number;
  category: MenuCategory;
};
export default function CategorySummaryChart({ location, category }: Props) {
  const { t } = useTranslation();
  const categorySummary = useGetCategorySummary(category?._id, location);
  const [chartConfig, setChartConfig] = useState<any>({
    height: 240,
    series: [
      {
        name: "Total",
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
      colors: ["#020617"],
      plotOptions: {
        bar: {
          columnWidth: "40%",
          borderRadius: 2,
        },
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
        theme: "dark",
      },
    },
  });

  useEffect(() => {
    const totals = categorySummary?.map((category) =>
      parseFloat((category?.total).toFixed(4))
    );
    const months = categorySummary?.map((category) => t(category?.month));
    if (categorySummary?.length > 1) {
      setChartConfig({
        ...chartConfig,
        type: categorySummary?.length > 1 ? "line" : "bar",
        series: [
          {
            name: "Total",
            data: totals,
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
          colors: ["#020617"],
          plotOptions: {
            bar: {
              columnWidth: "40%",
              borderRadius: 2,
            },
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
            categories: months,
          },
          yaxis: {
            labels: {
              style: {
                colors: "#616161",
                fontSize: "12px",
                fontFamily: "inherit",
                fontWeight: 400,
              },
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
            theme: "dark",
          },
        },
      });
    }
  }, [categorySummary]);

  return (
    <div className="flex flex-col gap-4  mx-auto w-full">
      <PriceChart chartConfig={chartConfig} selectedCategory={category} />
    </div>
  );
}
