import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  ExpenseTypes,
  FormElementsState,
  commonDateOptions,
} from "../../types";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetStockLocations } from "../../utils/api/location";
import {
  ProductInput,
  StockLocationInput,
  VendorInput,
} from "../../utils/panelInputs";
import GenericExpenses from "../expense/GenericExpenses";
import { InputTypes } from "../panelComponents/shared/types";

const BrandExpenses = () => {
  const { t } = useTranslation();
  const { brandId } = useParams<{ brandId: string }>();
  const products = useGetAccountProducts();
  const locations = useGetStockLocations();
  const vendors = useGetAccountVendors();
  if (!brandId) return null;
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      product: "",
      service: "",
      type: ExpenseTypes.STOCKABLE,
      vendor: "",
      brand: brandId,
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
      ProductInput({
        products: products.filter((p) => p.brand?.includes(brandId)),
        required: true,
      }),
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
    [products, brandId, vendors, locations, t]
  );

  useEffect(() => {
    setFilterPanelFormElements((prev) => ({ ...prev, brand: brandId }));
  }, [brandId]);

  return (
    <GenericExpenses
      title={t("Brand Expenses")}
      filterPanelFormElements={filterPanelFormElements}
      setFilterPanelFormElements={setFilterPanelFormElements}
      filterPanelInputs={filterPanelInputs}
    />
  );
};

export default BrandExpenses;
