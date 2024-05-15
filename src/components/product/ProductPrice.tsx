import { useEffect, useState } from "react";
import { AccountProduct } from "../../types";
import { useGetAccountInvoices } from "../../utils/api/account/invoice";
import { formatAsLocalDate } from "../../utils/format";
import PriceChart from "../analytics/accounting/PriceChart";

type Props = { selectedProduct: AccountProduct };
const ProductPrice = ({ selectedProduct }: Props) => {
  const invoices = useGetAccountInvoices();
  const [chartKey, setChartKey] = useState(0);
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
    const invoicesForProduct = invoices?.filter(
      (invoice) =>
        (invoice.product as AccountProduct)._id === selectedProduct?._id
    );
    const prices = invoicesForProduct
      ?.map((invoice) =>
        parseFloat((invoice.totalExpense / invoice.quantity).toFixed(4))
      )
      .reverse();
    const dates = invoicesForProduct?.map((invoice) => invoice.date).reverse();

    setChartConfig({
      ...chartConfig,
      type: invoicesForProduct?.length > 1 ? "line" : "bar",
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
          categories: dates.map((date) => formatAsLocalDate(date)),
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
    setChartKey((prev) => prev + 1);
  }, [selectedProduct]);
  return (
    <PriceChart
      key={chartKey}
      chartConfig={chartConfig}
      selectedProduct={selectedProduct}
    />
  );
};

export default ProductPrice;
