import {
  Card,
  CardBody,
  CardHeader,
  Typography,
} from "@material-tailwind/react";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useGetAccountProductExpenses } from "../../utils/api/account/expense";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { formatAsLocalDate } from "../../utils/format";
import PriceChart from "../analytics/accounting/PriceChart";

const ProductPrice = () => {
  const { productId } = useParams();
  const products = useGetAccountProducts();
  const selectedProduct = products?.find(
    (product) => product._id === productId
  );
  const invoices = useGetAccountProductExpenses(selectedProduct?._id ?? "");

  const sorted = useMemo(() => {
    const allSorted = [...(invoices ?? [])].sort((a, b) =>
      (a.date ?? "").localeCompare(b.date ?? "")
    );
    let prevPrice: number | null = null;
    return allSorted.filter((invoice) => {
      const price = parseFloat(
        (invoice.totalExpense / invoice.quantity).toFixed(4)
      );
      if (price === prevPrice) return false;
      prevPrice = price;
      return true;
    });
  }, [invoices]);

  const chartConfig = useMemo(() => {
    const prices = sorted.map((invoice) =>
      parseFloat((invoice.totalExpense / invoice.quantity).toFixed(4))
    );
    const dates = sorted.map((invoice) => invoice.date);
    const step = Math.max(1, Math.ceil(dates.length / 20));
    const tickValues = dates
      .filter((_, i) => i % step === 0 || i === dates.length - 1)
      .map((d) => (d ? formatAsLocalDate(d) : ""));

    return {
      height: 240,
      type: sorted.length > 1 ? "line" : "bar",
      tickValues,
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
          categories: dates.map((date) =>
            date && !isNaN(new Date(date).getTime())
              ? formatAsLocalDate(date)
              : ""
          ),
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
    };
  }, [invoices]);

  if (!selectedProduct) return <></>;

  // 0 kayıt
  if (sorted.length === 0) {
    return (
      <Card className="shadow-none">
        <CardBody className="flex items-center justify-center h-60 text-gray-400">
          <Typography variant="small">Henüz fiyat kaydı bulunmuyor.</Typography>
        </CardBody>
      </Card>
    );
  }

  // 1 kayıt — fiyat kartı
  if (sorted.length === 1) {
    const invoice = sorted[0];
    const price = parseFloat(
      (invoice.totalExpense / invoice.quantity).toFixed(4)
    );
    return (
      <Card className="shadow-none">
        <CardHeader
          floated={false}
          shadow={false}
          color="transparent"
          className="rounded-none"
        >
          <Typography variant="h6" color="blue-gray">
            {selectedProduct.name}
          </Typography>
        </CardHeader>
        <CardBody className="flex flex-col items-center justify-center h-60 gap-2">
          <Typography variant="h4" color="blue-gray">
            {price.toLocaleString("tr-TR")} ₺
          </Typography>
          <Typography variant="small" className="text-gray-500">
            {invoice.date ? formatAsLocalDate(invoice.date) : ""}
          </Typography>
        </CardBody>
      </Card>
    );
  }

  // 2+ kayıt — grafik
  return (
    <PriceChart
      key={selectedProduct._id}
      chartConfig={chartConfig}
      selectedProduct={selectedProduct}
    />
  );
};

export default ProductPrice;
