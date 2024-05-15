import { useTranslation } from "react-i18next";
import {
  AccountBrand,
  AccountExpenseType,
  AccountPackageType,
  AccountProduct,
  AccountStockLocation,
  AccountVendor,
} from "../../types";
import { useGetAccountInvoices } from "../../utils/api/account/invoice";
import { useGetAccountUnits } from "../../utils/api/account/unit";
import { formatAsLocalDate } from "../../utils/format";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { P1 } from "../panelComponents/Typography";

type Props = {
  selectedProduct: AccountProduct;
};
const ProductExpenses = ({ selectedProduct }: Props) => {
  const { t } = useTranslation();
  const invoices = useGetAccountInvoices();
  const units = useGetAccountUnits();
  const invoicesForProduct = invoices
    ?.filter(
      (invoice) =>
        (invoice.product as AccountProduct)._id === selectedProduct?._id
    )
    ?.map((invoice) => {
      return {
        ...invoice,
        product: (invoice.product as AccountProduct)?.name,
        expenseType: (invoice.expenseType as AccountExpenseType)?.name,
        packageType: (invoice.packageType as AccountPackageType)?.name,
        brand: (invoice.brand as AccountBrand)?.name,
        vendor: (invoice.vendor as AccountVendor)?.name,
        formattedDate: formatAsLocalDate(invoice.date),
        location: invoice.location as AccountStockLocation,
        lctn: (invoice.location as AccountStockLocation)?.name,
        unitPrice: parseFloat(
          (
            invoice.totalExpense /
            (invoice.quantity *
              ((invoice.packageType as AccountPackageType)?.quantity ?? 1))
          ).toFixed(4)
        ),
        unit: units?.find(
          (unit) =>
            unit._id === ((invoice.product as AccountProduct).unit as string)
        )?.name,
        expType: invoice.expenseType as AccountExpenseType,
        brnd: invoice.brand as AccountBrand,
        vndr: invoice.vendor as AccountVendor,
        pckgTyp: invoice.packageType as AccountPackageType,
        prdct: invoice.product as AccountProduct,
      };
    });
  const columns = [
    { key: "ID", isSortable: true },
    { key: t("Date"), isSortable: true },
    { key: t("Note"), isSortable: true },
    {
      key: t("Brand"),
      className: "min-w-32 pr-2",
      isSortable: true,
    },
    {
      key: t("Vendor"),
      className: "min-w-32 pr-2",
      isSortable: true,
    },
    { key: t("Location"), isSortable: true },
    {
      key: t("Expense Type"),
      className: "min-w-32 ",
      isSortable: true,
    },
    {
      key: t("Product"),
      className: "min-w-32 pr-2",
      isSortable: true,
    },
    {
      key: t("Package Type"),
      className: "min-w-32 ",
      isSortable: true,
    },
    { key: t("Quantity"), isSortable: true },
    { key: t("Unit"), isSortable: true },
    { key: t("Unit Price"), isSortable: true },
    { key: t("Total Expense"), isSortable: true },
  ];
  const rowKeys = [
    { key: "_id", className: "min-w-32 pr-2" },
    {
      key: "formattedDate",
      className: "min-w-32 pr-2",
    },
    { key: "note", className: "min-w-40 pr-2" },
    {
      key: "brand",
      className: "min-w-32 pr-2",
    },
    {
      key: "vendor",
      className: "min-w-32 pr-2",
    },
    {
      key: "lctn",
      className: "min-w-32 pr-4",
    },
    {
      key: "expenseType",
      node: (row: any) => {
        return (
          <div className=" min-w-32">
            <p
              className="w-fit rounded-md text-white text-sm ml-2 px-2 py-1 font-semibold "
              style={{
                backgroundColor: row?.expType?.backgroundColor,
              }}
            >
              {(row?.expType as AccountExpenseType)?.name}
            </p>
          </div>
        );
      },
    },
    {
      key: "product",
      className: "min-w-32 pr-2",
    },
    {
      key: "packageType",
      className: "min-w-32 pr-2",
    },
    { key: "quantity", className: "min-w-32" },
    {
      key: "unit",
    },
    {
      key: "unitPrice",
      node: (row: any) => {
        return (
          <div className="min-w-32">
            <P1>{row.unitPrice} ₺</P1>
          </div>
        );
      },
    },
    {
      key: "totalExpense",
      node: (row: any) => {
        return (
          <div className="min-w-32">
            <P1>
              {parseFloat(row.totalExpense)
                .toFixed(4)
                .replace(/\.?0*$/, "")}{" "}
              ₺
            </P1>
          </div>
        );
      },
    },
  ];
  return (
    <div className="w-[95%] mx-auto ">
      <GenericTable
        key={selectedProduct._id}
        rowKeys={rowKeys}
        columns={columns}
        rows={invoicesForProduct}
        title={t("Product Expenses")}
      />
    </div>
  );
};

export default ProductExpenses;
