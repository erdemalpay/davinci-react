import { Card, CardBody, Typography } from "@material-tailwind/react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccountProduct, OptionType } from "../../../types";
import { useGetAccountProductExpenses } from "../../../utils/api/account/expense";
import { useGetAccountExpenseTypes } from "../../../utils/api/account/expenseType";
import { useGetAccountProducts } from "../../../utils/api/account/product";
import { formatAsLocalDate } from "../../../utils/format";
import SelectInput from "../../panelComponents/FormElements/SelectInput";
import PriceChart from "./PriceChart";

export default function ProductPriceChart() {
  const { t } = useTranslation();
  const products = useGetAccountProducts();
  const expenseTypes = useGetAccountExpenseTypes();
  const [selectedExpenseType, setSelectedExpenseType] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<
    AccountProduct | undefined
  >(products[0]);
  const invoices = useGetAccountProductExpenses(selectedProduct?._id ?? "");
  const expenseTypeOptions = expenseTypes.map((expenseType) => ({
    value: expenseType._id,
    label: expenseType.name,
  }));
  const productOptions = useMemo(
    () =>
      products
        .filter(
          (product) =>
            !selectedExpenseType ||
            product.expenseType?.includes(selectedExpenseType)
        )
        .map((product) => ({
          value: product._id,
          label: product.name,
        })),
    [products, selectedExpenseType]
  );
  const chartConfig = useMemo(() => {
    const sorted = [...(invoices ?? [])].sort((a, b) =>
      (a?.date ?? "").localeCompare(b?.date ?? "")
    );
    const prices = sorted.map((invoice) =>
      parseFloat((invoice?.totalExpense / invoice?.quantity).toFixed(4))
    );
    const dates = sorted.map((invoice) => invoice?.date);
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
            date ? formatAsLocalDate(date) : ""
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

  return (
    <div className="flex flex-col gap-4  mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 px-4">
        <div className="sm:w-1/4">
          <SelectInput
            label={t("Expense Type")}
            options={expenseTypeOptions}
            value={
              expenseTypeOptions.find(
                (option) => option.value === selectedExpenseType
              ) ?? null
            }
            onChange={(selectedOption) => {
              setSelectedExpenseType(
                (selectedOption as OptionType)?.value ?? ""
              );
              setSelectedProduct(undefined);
            }}
            onClear={() => setSelectedExpenseType("")}
            placeholder={t("Expense Type")}
          />
        </div>
        <div className="sm:w-1/4">
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
                products.find(
                  (product) =>
                    product._id === (selectedOption as OptionType)?.value
                )
              );
            }}
            isOnClearActive={false}
            placeholder={t("Select a product")}
          />
        </div>
      </div>
      {selectedProduct &&
        (invoices.length > 0 ? (
          <PriceChart
            key={selectedProduct._id}
            chartConfig={chartConfig}
            selectedProduct={selectedProduct}
          />
        ) : (
          <Card className="shadow-none">
            <CardBody className="flex items-center justify-center h-60 text-gray-400">
              <Typography variant="small">
                {t("No price records yet")}
              </Typography>
            </CardBody>
          </Card>
        ))}
    </div>
  );
}
