import {
  Card,
  CardBody,
  CardHeader,
  Typography,
} from "@material-tailwind/react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MenuItem, TURKISHLIRA } from "../../types";
import { formatAsLocalDate } from "../../utils/format";
import PriceChart from "../analytics/accounting/PriceChart";

type PriceHistory = {
  date: string;
  price: number;
};

type Props = {
  item?: MenuItem;
  title?: string;
};

export default function MenuItemPriceHistoryChart({ item, title }: Props) {
  const { t } = useTranslation();
  const chartTitle = title ?? t("Price History");

  // Çizgi grafiğinde her gün tek nokta olabilir; aynı gün birden fazla fiyat
  // girildiyse o günün son fiyatı kalır.
  const dailyPriceHistory = useMemo(() => {
    const lastPriceByDay = new Map<string, number>();
    (item?.priceHistory ?? []).forEach((priceHistory: PriceHistory) => {
      lastPriceByDay.set(
        formatAsLocalDate(priceHistory.date),
        priceHistory.price
      );
    });
    return [...lastPriceByDay].map(([date, price]) => ({ date, price }));
  }, [item]);

  if (dailyPriceHistory.length === 0) {
    return (
      <Card className="shadow-none">
        <CardBody className="flex items-center justify-center h-60 text-gray-400">
          <Typography variant="small">{t("No price records yet")}</Typography>
        </CardBody>
      </Card>
    );
  }

  // Tek kayıtta çizgi grafiği çizilemiyor; fiyat kartı gösterilir.
  if (dailyPriceHistory.length === 1) {
    const priceHistory = dailyPriceHistory[0];
    return (
      <Card className="shadow-none">
        <CardHeader
          floated={false}
          shadow={false}
          color="transparent"
          className="rounded-none"
        >
          <Typography variant="h6" color="blue-gray">
            {chartTitle}
          </Typography>
        </CardHeader>
        <CardBody className="flex flex-col items-center justify-center h-60 gap-2">
          <Typography variant="h4" color="blue-gray">
            {priceHistory.price.toLocaleString("tr-TR")} {TURKISHLIRA}
          </Typography>
          <Typography variant="small" className="text-gray-500">
            {priceHistory.date}
          </Typography>
        </CardBody>
      </Card>
    );
  }

  return (
    <PriceChart
      key={item?._id}
      chartConfig={{
        type: "line",
        tickValues: dailyPriceHistory.map((priceHistory) => priceHistory.date),
        series: [
          {
            name: "Price",
            data: dailyPriceHistory.map((priceHistory) => priceHistory.price),
          },
        ],
        options: {
          colors: ["#020617"],
          xaxis: {
            categories: dailyPriceHistory.map(
              (priceHistory) => priceHistory.date
            ),
          },
        },
      }}
      title={chartTitle}
      hideLegend
    />
  );
}
