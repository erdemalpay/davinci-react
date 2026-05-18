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

  const chartConfig = useMemo(() => {
    const sorted = [...(invoices ?? [])].sort((a, b) =>
      (a.date ?? "").localeCompare(b.date ?? "")
    );
    const prices = sorted.map((invoice) =>
      parseFloat((invoice.totalExpense / invoice.quantity).toFixed(4))
    );
    const dates = sorted.map((invoice) => invoice.date);
    const step = Math.max(1, Math.ceil(dates.length / 20));
    const tickValues = dates
      .filter((_, i) => i % step === 0 || i === dates.length - 1)
      .map((d) => formatAsLocalDate(d ?? ""));

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

  return (
    <PriceChart
      key={selectedProduct._id}
      chartConfig={chartConfig}
      selectedProduct={selectedProduct}
    />
  );
};

export default ProductPrice;
