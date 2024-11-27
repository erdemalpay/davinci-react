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
import { MenuItem } from "../../../types";
import { useGetMenuItems } from "../../../utils/api/menu/menu-item";
import { formatAsLocalDate } from "../../../utils/format";
import CommonSelectInput from "../../common/SelectInput";

type PriceHistory = {
  date: string;
  price: number;
};
type Props = {};
export default function MenuItemPriceChart({}: Props) {
  const { t } = useTranslation();
  const items = useGetMenuItems();

  const itemOptions = items?.map((item) => {
    return {
      value: item._id.toString(),
      label: item.name,
    };
  });
  const [selectedItem, setSelectedItem] = useState<MenuItem | undefined>(
    items ? items[0] : undefined
  );
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
    if (!selectedItem?.priceHistory) return;
    const uniquePriceHistory: PriceHistory[] = selectedItem.priceHistory.reduce(
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
    setChartConfig({
      ...chartConfig,
      type: prices?.length > 1 ? "line" : "bar",
      series: [
        {
          name: "Price",
          data: prices,
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
          categories: dates?.map((date) => formatAsLocalDate(date)),
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
  }, [selectedItem]);

  return (
    <div className="flex flex-col gap-4  mx-auto">
      <div className="sm:w-1/4 px-4">
        <CommonSelectInput
          label={t("Product")}
          options={itemOptions}
          value={
            selectedItem
              ? {
                  value: selectedItem._id.toString(),
                  label: selectedItem.name,
                }
              : null
          }
          onChange={(selectedOption) => {
            setSelectedItem(
              items?.find(
                (item) => item._id.toString() === selectedOption?.value
              )
            );
          }}
          placeholder={t("Select a product")}
        />
      </div>

      <Card className="shadow-none">
        <CardHeader
          floated={false}
          shadow={false}
          color="transparent"
          className="flex flex-row gap-4 rounded-none  items-center"
        >
          <div className="w-max rounded-lg bg-gray-900 p-5 text-white">
            <Square3Stack3DIcon className="h-6 w-6" />
          </div>
          <div>
            <Typography variant="h6" color="blue-gray">
              {selectedItem && selectedItem?.name}
            </Typography>
          </div>
        </CardHeader>
        <CardBody className="px-2 pb-0">
          <Chart {...(chartConfig as any)} />
        </CardBody>
      </Card>
    </div>
  );
}
