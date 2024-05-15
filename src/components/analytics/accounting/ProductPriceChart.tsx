import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccountProduct, AccountUnit } from "../../../types";
import { useGetAccountInvoices } from "../../../utils/api/account/invoice";
import { useGetAccountProducts } from "../../../utils/api/account/product";
import { formatAsLocalDate } from "../../../utils/format";
import SelectInput from "../../common/SelectInput";
import PriceChart from "./PriceChart";

type Props = {};
export default function ProductPriceChart({}: Props) {
  const { t } = useTranslation();

  const products = useGetAccountProducts();
  const invoices = useGetAccountInvoices();
  const [chartKey, setChartKey] = useState(0);
  const productOptions = products?.map((product) => {
    return {
      value: product._id,
      label: product.name + `(${(product.unit as AccountUnit).name})`,
    };
  });
  const [selectedProduct, setSelectedProduct] = useState<AccountProduct>();
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
    <div className="flex flex-col gap-4  mx-auto">
      <div className="sm:w-1/4 px-4">
        <SelectInput
          label={t("Product")}
          options={productOptions}
          value={
            selectedProduct
              ? {
                  value: selectedProduct._id,
                  label:
                    selectedProduct.name +
                    " (" +
                    (selectedProduct.unit as AccountUnit).name +
                    ")",
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
