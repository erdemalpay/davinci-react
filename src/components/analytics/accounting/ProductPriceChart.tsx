import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccountProduct } from "../../../types";
import { useGetAccountProductExpenses } from "../../../utils/api/account/expense";
import { useGetAccountProducts } from "../../../utils/api/account/product";
import { formatAsLocalDate } from "../../../utils/format";
import SelectInput from "../../common/SelectInput";
import PriceChart from "./PriceChart";

export default function ProductPriceChart() {
  const { t } = useTranslation();
  const products = useGetAccountProducts();
  const [selectedProduct, setSelectedProduct] = useState<
    AccountProduct | undefined
  >(products ? products[0] : undefined);
  const invoices = selectedProduct
    ? useGetAccountProductExpenses(selectedProduct?._id)
    : [];
  const [chartKey, setChartKey] = useState(0);
  const productOptions = products?.map((product) => {
    return {
      value: product._id,
      label: product.name,
    };
  });

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
    const prices = invoices?.map((invoice) =>
      parseFloat((invoice?.totalExpense / invoice?.quantity).toFixed(4))
    );
    const dates = invoices?.map((invoice) => invoice?.date);
    if (invoices?.length > 1) {
      setChartConfig({
        ...chartConfig,
        type: invoices?.length > 1 ? "line" : "bar",
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
    }
  }, [selectedProduct]);
  useEffect(() => {
    setChartKey((prevKey) => prevKey + 1);
  }, [invoices]);

  return (
    <div className="flex flex-col gap-4  mx-auto">
      <div className="sm:w-1/4 px-4">
        <SelectInput
          label={t("Product")}
          options={productOptions}
          value={
            selectedProduct
              ? {
                  value: selectedProduct._id,
                  label: selectedProduct.name,
                }
              : null
          }
          onChange={(selectedOption) => {
            setSelectedProduct(
              products?.find((product) => product._id === selectedOption?.value)
            );
          }}
          placeholder={t("Select a product")}
        />
      </div>

      {selectedProduct && (
        <PriceChart
          key={chartKey}
          chartConfig={chartConfig}
          selectedProduct={selectedProduct}
        />
      )}
    </div>
  );
}
