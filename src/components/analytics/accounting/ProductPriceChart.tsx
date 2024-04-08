import { Square3Stack3DIcon } from "@heroicons/react/24/outline";
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
} from "@material-tailwind/react";
import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { useTranslation } from "react-i18next";
import { AccountProduct, AccountUnit } from "../../../types";
import { useGetAccountInvoices } from "../../../utils/api/account/invoice";
import { useGetAccountProducts } from "../../../utils/api/account/product";
import { formatAsLocalDate } from "../../../utils/format";
import SelectInput from "../../common/SelectInput";

type Props = {};
export default function ProductPriceChart({}: Props) {
  const { t } = useTranslation();

  const products = useGetAccountProducts();
  const invoices = useGetAccountInvoices();
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
  }, [selectedProduct]);

  return (
    <div className="flex flex-col gap-4  mx-auto">
      <div className="sm:w-1/2 px-4">
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

      <Card className="shadow-none">
        <CardHeader
          floated={false}
          shadow={false}
          color="transparent"
          className="flex flex-col gap-4 rounded-none md:flex-row md:items-center"
        >
          <div className="w-max rounded-lg bg-gray-900 p-5 text-white">
            <Square3Stack3DIcon className="h-6 w-6" />
          </div>
          <div>
            <Typography variant="h6" color="blue-gray">
              {selectedProduct &&
                selectedProduct?.name +
                  "(" +
                  (selectedProduct?.unit as AccountUnit)?.name +
                  ")"}
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
