import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  ExpenseTypes,
  FormElementsState,
  commonDateOptions,
} from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetStockLocations } from "../../utils/api/location";
import {
  BrandInput,
  ProductInput,
  StockLocationInput,
} from "../../utils/panelInputs";
import GenericExpenses from "../expense/GenericExpenses";
import { InputTypes } from "../panelComponents/shared/types";

const VendorExpenses = () => {
  const { t } = useTranslation();
  const { vendorId } = useParams<{ vendorId: string }>();
  const brands = useGetAccountBrands();
  const products = useGetAccountProducts();
  const locations = useGetStockLocations();
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      product: "",
      service: "",
      type: ExpenseTypes.STOCKABLE,
      vendor: vendorId ?? "",
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
  const filterPanelInputs = [
    ProductInput({
      products: products.filter((p) => p.vendor?.includes(vendorId ?? "")),
      required: true,
    }),
    BrandInput({ brands, required: true }),
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
  ];
  useEffect(() => {
    if (vendorId) {
      setFilterPanelFormElements((prev) => ({ ...prev, vendor: vendorId }));
    }
  }, [vendorId]);
  if (!vendorId) return null;

  return (
    <GenericExpenses
      title={t("Vendor Expenses")}
      filterPanelFormElements={filterPanelFormElements}
      setFilterPanelFormElements={setFilterPanelFormElements}
      filterPanelInputs={filterPanelInputs}
    />
  );
};

export default VendorExpenses;
