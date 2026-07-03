import { Square3Stack3DIcon } from "@heroicons/react/24/outline";
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
} from "@material-tailwind/react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { useTranslation } from "react-i18next";
import { MenuItem } from "../../types";
import { formatAsLocalDate } from "../../utils/format";

type PriceHistory = {
  date: string;
  price: number;
};

type Props = {
  item?: MenuItem;
};

export default function MenuItemPriceHistoryChart({ item }: Props) {
  const { t } = useTranslation();
  const [chartConfig, setChartConfig] = useState<any>({
    height: 240,
    series: [
      {
        name: "Price",
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
    if (!item?.priceHistory) return;
    const uniquePriceHistory: PriceHistory[] = item.priceHistory.reduce(
      (
        acc: { set: Set<string>; list: PriceHistory[] },
        priceHistory: PriceHistory
      ) => {
        const uniqueKey = `${priceHistory.price}-${format(
          priceHistory.date,
          "yyyy-MM-dd"
        )}`;
        if (!acc.set.has(uniqueKey)) {
          acc.set.add(uniqueKey);
          acc.list.push(priceHistory);
        }
        return acc;
      },
      { set: new Set<string>(), list: [] }
    ).list;
    const prices = uniquePriceHistory.map((priceHistory) => priceHistory.price);
    const dates = uniquePriceHistory.map((priceHistory) => priceHistory.date);
    setChartConfig((prev: any) => ({
      ...prev,
      type: prices?.length > 1 ? "line" : "bar",
      series: [
        {
          name: "Price",
          data: prices,
        },
      ],
      options: {
        ...prev.options,
        xaxis: {
          ...prev.options.xaxis,
          categories: dates?.map((date) => formatAsLocalDate(date)),
        },
      },
    }));
  }, [item]);

  return (
    <Card className="shadow-none border border-gray-200 rounded-md">
      <CardHeader
        floated={false}
        shadow={false}
        color="transparent"
        className="flex flex-row gap-4 rounded-none  items-center"
      >
        <div>
          <Typography variant="h6" color="blue-gray">
            {t("Price History")}
          </Typography>
        </div>
      </CardHeader>
      <CardBody className="px-2 pb-0">
        <Chart {...(chartConfig as any)} />
      </CardBody>
    </Card>
  );
}
