import { InputTypes } from "../components/panelComponents/shared/types";
import {
  AccountBrand,
  AccountExpenseType,
  AccountPaymentMethod,
  AccountProduct,
  AccountVendor,
  Location,
} from "../types/index";
import { AccountService } from "./../types/index";

export function NameInput({ required = true, t }: { required?: boolean; t: (key: string) => string }) {
  return {
    type: InputTypes.TEXT,
    formKey: "name",
    label: t("Name"),
    placeholder: t("Name"),
    required: required,
  };
}
export function QuantityInput({
  required = true,
  isNumberButtonActive = false,
  t,
}: {
  required?: boolean;
  isNumberButtonActive?: boolean;
  t: (key: string) => string;
}) {
  return {
    type: InputTypes.NUMBER,
    formKey: "quantity",
    label: t("Quantity"),
    placeholder: t("Quantity"),
    required: required,
    isNumberButtonActive: isNumberButtonActive,
  };
}
export function BackgroundColorInput({ required = true, t }: { required?: boolean; t: (key: string) => string }) {
  return {
    type: InputTypes.COLOR,
    formKey: "backgroundColor",
    label: t("Background Color"),
    placeholder: t("Background Color"),
    required: required,
  };
}
export function DateInput({ required = true, t }: { required?: boolean; t: (key: string) => string }) {
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
  t,
}: {
  required?: boolean;
  isMultiple?: boolean;
  isDisabled?: boolean;
  brands: AccountBrand[];
  t: (key: string) => string;
}) {
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
  t,
}: {
  required?: boolean;
  isMultiple?: boolean;
  vendors: AccountVendor[];
  t: (key: string) => string;
}) {
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
  t,
}: {
  required?: boolean;
  isMultiple?: boolean;
  invalidateKeys?: { key: string; defaultValue: any }[];
  expenseTypes: AccountExpenseType[];
  t: (key: string) => string;
}) {
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
  t,
}: {
  required?: boolean;
  isMultiple?: boolean;
  isDisabled?: boolean;
  invalidateKeys?: { key: string; defaultValue: string }[];
  products: AccountProduct[];
  t: (key: string) => string;
}) {
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
  t,
}: {
  required?: boolean;
  isMultiple?: boolean;
  locations: Location[];
  isDisabled?: boolean;
  t: (key: string) => string;
}) {
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
  t,
}: {
  required?: boolean;
  isMultiple?: boolean;
  isDisabled?: boolean;
  paymentMethods: AccountPaymentMethod[];
  t: (key: string) => string;
}) {
  return {
    type: InputTypes.SELECT,
    formKey: "paymentMethod",
    label: t("Payment Method"),
    options: [
      ...(paymentMethods?.map((input) => {
        return {
          value: input._id,
          label: input.name,
        };
      }) || []),
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
  isDisabled = false,
  isTopFlexRow = false,
  locations,
  t,
}: {
  locations: Location[];
  required?: boolean;
  isMultiple?: boolean;
  isDisabled?: boolean;
  isTopFlexRow?: boolean;
  t: (key: string) => string;
}) {
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
    isDisabled: isDisabled,
    isTopFlexRow: isTopFlexRow,
  };
}

export function ServiceInput({
  required = false,
  isMultiple = false,
  isDisabled = false,
  invalidateKeys = [],
  services,
  t,
}: {
  required?: boolean;
  isMultiple?: boolean;
  isDisabled?: boolean;
  invalidateKeys?: { key: string; defaultValue: string }[];
  services: AccountService[];
  t: (key: string) => string;
}) {
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
