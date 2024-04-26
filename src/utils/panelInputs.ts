import { useTranslation } from "react-i18next";
import { InputTypes } from "../components/panelComponents/shared/types";
import {
  AccountBrand,
  AccountExpenseType,
  AccountFixture,
  AccountPackageType,
  AccountProduct,
  AccountStockLocation,
  AccountUnit,
  AccountVendor,
  Location,
} from "../types/index";

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
  brands,
}: {
  required?: boolean;
  isMultiple?: boolean;
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
  expenseTypes,
}: {
  required?: boolean;
  isMultiple?: boolean;
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
    isMultiple: isMultiple,
    required: required,
  };
}

export function PackageTypeInput({
  required = false,
  isMultiple = false,
  isDisabled = false,
  packages,
}: {
  required?: boolean;
  isMultiple?: boolean;
  isDisabled?: boolean;
  packages: AccountPackageType[];
}) {
  const { t } = useTranslation();

  return {
    type: InputTypes.SELECT,
    formKey: "packages",
    label: t("Package Type"),
    options: packages.map((item) => {
      return {
        value: item._id,
        label: item.name,
      };
    }),
    placeholder: t("Package Type"),
    isMultiple: isMultiple,
    isDisabled: isDisabled,
    required: required,
  };
}

export function UnitInput({
  required = false,
  isMultiple = false,
  units,
}: {
  required?: boolean;
  isMultiple?: boolean;
  units: AccountUnit[];
}) {
  const { t } = useTranslation();

  return {
    type: InputTypes.SELECT,
    formKey: "unit",
    label: t("Unit"),
    options: units.map((unit) => {
      return {
        value: unit._id,
        label: unit.name,
      };
    }),
    placeholder: t("Unit"),
    isMultiple: isMultiple,
    required: required,
  };
}
export function ProductInput({
  required = false,
  isMultiple = false,
  invalidateKeys = [],
  products,
}: {
  required?: boolean;
  isMultiple?: boolean;
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
        label: product.name + `(${(product.unit as AccountUnit).name})`,
      };
    }),
    invalidateKeys: invalidateKeys,
    placeholder: t("Product"),
    isMultiple: isMultiple,
    required: required,
  };
}

export function StockLocationInput({
  required = true,
  isMultiple = false,
  locations,
}: {
  required?: boolean;
  isMultiple?: boolean;
  locations: AccountStockLocation[];
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

export function FixtureInput({
  required = false,
  isMultiple = false,
  invalidateKeys = [],
  fixtures,
}: {
  required?: boolean;
  isMultiple?: boolean;
  invalidateKeys?: { key: string; defaultValue: string }[];
  fixtures: AccountFixture[];
}) {
  const { t } = useTranslation();
  return {
    type: InputTypes.SELECT,
    formKey: "fixture",
    label: t("Fixture"),
    options: fixtures.map((fixture) => {
      return {
        value: fixture._id,
        label: fixture.name,
      };
    }),
    placeholder: t("Fixture"),
    invalidateKeys: invalidateKeys,
    isMultiple: isMultiple,
    required: required,
  };
}