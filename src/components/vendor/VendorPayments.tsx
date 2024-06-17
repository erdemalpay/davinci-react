import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AccountPaymentMethod,
  AccountStockLocation,
  AccountVendor,
} from "../../types";
import { useGetAccountPayments } from "../../utils/api/account/payment";
import { formatAsLocalDate } from "../../utils/format";
import GenericTable from "../panelComponents/Tables/GenericTable";

type Props = { selectedVendor: AccountVendor };

const VendorPayments = ({ selectedVendor }: Props) => {
  const { t } = useTranslation();
  const payments = useGetAccountPayments();
  const [tableKey, setTableKey] = useState(0);
  const allRows = payments
    ?.filter((i) => i?.vendor?._id === selectedVendor?._id)
    ?.map((payment) => {
      return {
        ...payment,
        formattedDate: formatAsLocalDate(payment?.date),
        usr: payment?.user?.name,
        pymntMthd: (payment?.paymentMethod as AccountPaymentMethod)?.name,
        lctn: (payment?.location as AccountStockLocation)?.name,
      };
    });
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: "ID", isSortable: true },
    { key: t("Date"), isSortable: true, className: "min-w-32 pr-2" },
    { key: t("User"), isSortable: true },
    { key: t("Location"), isSortable: true },
    {
      key: t("Payment Method"),
      className: "min-w-32 ",
      isSortable: true,
    },
    { key: t("Amount"), isSortable: true },
    { key: t("Product Expense ID"), isSortable: true },
    { key: t("Fixture Expense ID"), isSortable: true },
    { key: t("Service Expense ID"), isSortable: true },
  ];
  const rowKeys = [
    { key: "_id", className: "min-w-32 pr-2" },
    {
      key: "formattedDate",
      className: "min-w-32 pr-2",
    },
    { key: "usr" },
    { key: "lctn" },
    { key: "pymntMthd" },
    { key: "amount" },
    { key: "invoice" },
    { key: "fixtureInvoice" },
    { key: "serviceInvoice" },
  ];

  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [payments, selectedVendor]);

  return (
    <div className="w-[95%] mx-auto ">
      <GenericTable
        key={selectedVendor?._id + tableKey}
        rowKeys={rowKeys}
        columns={columns}
        isActionsActive={false}
        rows={rows}
        title={t("Vendor Payments")}
        isSearch={false}
      />
    </div>
  );
};

export default VendorPayments;
