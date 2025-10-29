import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ExpenseTypes,
  FormElementsState,
  commonDateOptions,
} from "../../types";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetStockLocations } from "../../utils/api/location";
import { StockLocationInput, VendorInput } from "../../utils/panelInputs";
import GenericExpenses from "../expense/GenericExpenses";
import { InputTypes } from "../panelComponents/shared/types";
type Props = {
  selectedService: { _id: string } | null;
};
const ServiceExpenses = ({ selectedService }: Props) => {
  const { t } = useTranslation();
  const vendors = useGetAccountVendors();
  const locations = useGetStockLocations();
  if (!selectedService?._id) return null;
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      product: "",
      service: selectedService._id,
      type: ExpenseTypes.NONSTOCKABLE,
      vendor: "",
      brand: "",
      expenseType: "",
      paymentMethod: "",
      location: "",
      date: "",
      before: "",
      after: "",
      sort: "",
      asc: 1,
      search: "",
    });
  const filterPanelInputs = useMemo(
    () => [
      VendorInput({ vendors, required: true }),
      StockLocationInput({ locations }),
      {
        type: InputTypes.SELECT,
        formKey: "date",
        label: t("Date"),
        options: commonDateOptions.map((o) => ({
          value: o.value,
          label: t(o.label),
        })),
        placeholder: t("Date"),
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
    ],
    [vendors, locations, t]
  );
  useEffect(() => {
    setFilterPanelFormElements((prev) => ({
      ...prev,
      service: selectedService._id,
    }));
  }, [selectedService?._id]);
  return (
    <GenericExpenses
      title={t("Service Expenses")}
      filterPanelFormElements={filterPanelFormElements}
      setFilterPanelFormElements={setFilterPanelFormElements}
      filterPanelInputs={filterPanelInputs}
    />
  );
};

export default ServiceExpenses;
