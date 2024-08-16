import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { AccountPaymentMethod, AccountStockLocation } from "../../types";
import { useGetAccountPayments } from "../../utils/api/account/payment";
import { useGetAccountPaymentMethods } from "../../utils/api/account/paymentMethod";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetUsers } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { StockLocationInput } from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";
type FormElementsState = {
  [key: string]: any;
};
const VendorPayments = () => {
  const { t } = useTranslation();
  const { vendorId } = useParams();
  const vendors = useGetAccountVendors();
  const locations = useGetAccountStockLocations();
  const users = useGetUsers();
  const paymentMethods = useGetAccountPaymentMethods();
  const selectedVendor = vendors?.find((item) => item._id === vendorId);
  if (!selectedVendor) return <></>;
  const payments = useGetAccountPayments();
  const [tableKey, setTableKey] = useState(0);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      createdBy: "",
      location: "",
      paymentMethod: "",
      before: "",
      after: "",
    });
  const allRows = payments
    ?.filter((i) => i?.vendor?._id === selectedVendor?._id)
    ?.map((payment) => {
      return {
        ...payment,
        formattedDate: formatAsLocalDate(payment?.date),
        usr: payment?.user?.name,
        userId: payment?.user?._id,
        pymntMthd: t((payment?.paymentMethod as AccountPaymentMethod)?.name),
        pymntMthdId: (payment?.paymentMethod as AccountPaymentMethod)?._id,
        lctn: (payment?.location as AccountStockLocation)?.name,
        lctnId: (payment?.location as AccountStockLocation)?._id,
      };
    });
  const [showFilters, setShowFilters] = useState(false);
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
    { key: t("Product Expense ID"), isSortable: true },
    { key: t("Fixture Expense ID"), isSortable: true },
    { key: t("Service Expense ID"), isSortable: true },
    { key: t("Amount"), isSortable: true },
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
    { key: "invoice" },
    { key: "fixtureInvoice" },
    { key: "serviceInvoice" },
    { key: "amount" },
  ];

  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "createdBy",
      label: t("Created By"),
      options: users
        .filter((user) => user.active)
        .map((user) => ({
          value: user._id,
          label: user.name,
        })),
      placeholder: t("Created By"),
      required: true,
    },
    StockLocationInput({ locations: locations, required: true }),
    {
      type: InputTypes.SELECT,
      formKey: "paymentMethod",
      label: t("Payment Method"),
      options: paymentMethods.map((paymentMethod) => ({
        value: paymentMethod._id,
        label: t(paymentMethod.name),
      })),
      placeholder: t("Payment Method"),
      required: true,
    },

    {
      type: InputTypes.DATE,
      formKey: "after",
      label: t("Start Date"),
      placeholder: t("Start Date"),
      required: true,
      isDatePicker: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "before",
      label: t("End Date"),
      placeholder: t("End Date"),
      required: true,
      isDatePicker: true,
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
  };
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];

  useEffect(() => {
    const filteredRows = allRows.filter((row) => {
      if (!row?.date) {
        return false;
      }
      return (
        (filterPanelFormElements.before === "" ||
          row.date <= filterPanelFormElements.before) &&
        (filterPanelFormElements.after === "" ||
          row.date >= filterPanelFormElements.after) &&
        passesFilter(filterPanelFormElements.createdBy, row.userId) &&
        passesFilter(filterPanelFormElements.location, row.lctnId) &&
        passesFilter(filterPanelFormElements.paymentMethod, row.pymntMthdId)
      );
    });
    setRows(filteredRows);
    setTableKey((prev) => prev + 1);
  }, [
    payments,
    selectedVendor,
    locations,
    paymentMethods,
    filterPanelFormElements,
  ]);

  return (
    <div className="w-[95%] mx-auto ">
      <GenericTable
        key={selectedVendor?._id + tableKey}
        rowKeys={rowKeys}
        columns={columns}
        isActionsActive={false}
        rows={rows}
        filterPanel={filterPanel}
        filters={filters}
        title={t("Vendor Payments")}
        isSearch={false}
      />
    </div>
  );
};

export default VendorPayments;
