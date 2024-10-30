import { useTranslation } from "react-i18next";
import { InputTypes } from "../components/panelComponents/shared/types";
import {
  AccountBrand,
  AccountExpenseType,
  AccountPaymentMethod,
  AccountProduct,
  AccountStockLocation,
  AccountVendor,
  Location,
  NOTPAID,
} from "../types/index";
import { AccountService } from "./../types/index";

export function NameInput({ required = true } = {}) {
  const { t } = useTranslation();
  return {
    type: InputTypes.TEXT,
    formKey: "name",
    label: t("Name"),
    placeholder: t("Name"),
    required: required,
  };
}
export function QuantityInput({ required = true } = {}) {
  const { t } = useTranslation();
  return {
    type: InputTypes.NUMBER,
    formKey: "quantity",
    label: t("Quantity"),
    placeholder: t("Quantity"),
    required: required,
  };
}
export function BackgroundColorInput({ required = true } = {}) {
  const { t } = useTranslation();
  return {
    type: InputTypes.COLOR,
    formKey: "backgroundColor",
    label: t("Background Color"),
    placeholder: t("Background Color"),
    required: required,
  };
}
export function DateInput({ required = true } = {}) {
  const { t } = useTranslation();
  return {
    type: InputTypes.DATE,
    formKey: "date",
    label: t("Date"),
    placeholder: t("Date"),
    required: required,
  };
}
export function BrandInput({
  required = false,
  isMultiple = false,
  isDisabled = false,
  brands,
}: {
  required?: boolean;
  isMultiple?: boolean;
  isDisabled?: boolean;
  brands: AccountBrand[];
}) {
  const { t } = useTranslation();
  return {
    type: InputTypes.SELECT,
    formKey: "brand",
    label: t("Brand"),
    options: brands.map((brand) => ({
      value: brand._id,
      label: brand.name,
    })),
    placeholder: t("Brand"),
    isDisabled: isDisabled,
    isMultiple: isMultiple,
    required: required,
  };
}

export function VendorInput({
  required = false,
  isMultiple = false,
  vendors,
}: {
  required?: boolean;
  isMultiple?: boolean;
  vendors: AccountVendor[];
}) {
  const { t } = useTranslation();
  return {
    type: InputTypes.SELECT,
    formKey: "vendor",
    label: t("Vendor"),
    options: vendors.map((vendor) => {
      return {
        value: vendor._id,
        label: vendor.name,
      };
    }),
    placeholder: t("Vendor"),
    isMultiple: isMultiple,
    required: required,
  };
}

export function ExpenseTypeInput({
  required = false,
  isMultiple = false,
  invalidateKeys = [],
  expenseTypes,
}: {
  required?: boolean;
  isMultiple?: boolean;
  invalidateKeys?: { key: string; defaultValue: any }[];
  expenseTypes: AccountExpenseType[];
}) {
  const { t } = useTranslation();
  return {
    type: InputTypes.SELECT,
    formKey: "expenseType",
    label: t("Expense Type"),
    options: expenseTypes.map((expenseType) => {
      return {
        value: expenseType._id,
        label: expenseType.name,
      };
    }),
    placeholder: t("Expense Type"),
    invalidateKeys: invalidateKeys,
    isMultiple: isMultiple,
    required: required,
  };
}

export function ProductInput({
  required = false,
  isDisabled = false,
  isMultiple = false,
  invalidateKeys = [],
  products,
}: {
  required?: boolean;
  isMultiple?: boolean;
  isDisabled?: boolean;
  invalidateKeys?: { key: string; defaultValue: string }[];
  products: AccountProduct[];
}) {
  const { t } = useTranslation();
  return {
    type: InputTypes.SELECT,
    formKey: "product",
    label: t("Product"),
    options: products.map((product) => {
      return {
        value: product._id,
        label: product.name,
      };
    }),
    isDisabled: isDisabled,
    invalidateKeys: invalidateKeys,
    placeholder: t("Product"),
    isMultiple: isMultiple,
    required: required,
  };
}

export function StockLocationInput({
  required = true,
  isMultiple = false,
  isDisabled = false,
  locations,
}: {
  required?: boolean;
  isMultiple?: boolean;
  locations: AccountStockLocation[];
  isDisabled?: boolean;
}) {
  const { t } = useTranslation();
  return {
    type: InputTypes.SELECT,
    formKey: "location",
    label: t("Location"),
    options: locations.map((input) => {
      return {
        value: input._id,
        label: input.name,
      };
    }),
    placeholder: t("Location"),
    isMultiple: isMultiple,
    isDisabled: isDisabled,
    required: required,
  };
}

export function PaymentMethodInput({
  required = true,
  isMultiple = false,
  isDisabled = false,
  paymentMethods,
}: {
  required?: boolean;
  isMultiple?: boolean;
  isDisabled?: boolean;
  paymentMethods: AccountPaymentMethod[];
}) {
  const { t } = useTranslation();
  return {
    type: InputTypes.SELECT,
    formKey: "paymentMethod",
    label: t("Payment Method"),
    options: [
      ...(paymentMethods?.map((input) => {
        return {
          value: input._id,
          label: t(input.name),
        };
      }) || []),
      {
        value: NOTPAID,
        label: t("Not Paid"),
      },
    ],
    isDisabled: isDisabled,
    placeholder: t("Payment Method"),
    isMultiple: isMultiple,
    required: required,
  };
}
export function LocationInput({
  required = true,
  isMultiple = false,
  locations,
}: {
  required?: boolean;
  isMultiple?: boolean;
  locations: Location[];
}) {
  const { t } = useTranslation();
  return {
    type: InputTypes.SELECT,
    formKey: "location",
    label: t("Location"),
    options: locations.map((input) => {
      return {
        value: input._id,
        label: input.name,
      };
    }),
    placeholder: t("Location"),
    isMultiple: isMultiple,
    required: required,
  };
}

export function ServiceInput({
  required = false,
  isMultiple = false,
  isDisabled = false,
  invalidateKeys = [],
  services,
}: {
  required?: boolean;
  isMultiple?: boolean;
  isDisabled?: boolean;
  invalidateKeys?: { key: string; defaultValue: string }[];
  services: AccountService[];
}) {
  const { t } = useTranslation();
  return {
    type: InputTypes.SELECT,
    formKey: "service",
    label: t("Service"),
    options: services.map((service) => {
      return {
        value: service._id,
        label: service.name,
      };
    }),
    isDisabled: isDisabled,
    placeholder: t("Service"),
    invalidateKeys: invalidateKeys,
    isMultiple: isMultiple,
    required: required,
  };
}
