import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import { useGetAccountBrands } from "../utils/api/account/brand";
import { useGetAccountCountLists } from "../utils/api/account/countList";
import { useGetAccountExpenseTypes } from "../utils/api/account/expenseType";
import { useGetAccountVendors } from "../utils/api/account/vendor";
import { useGetAllLocations } from "../utils/api/location";
import { useGetMenuItems } from "../utils/api/menu/menu-item";

export const initialProductForm = {
  brand: [] as string[],
  vendor: [] as string[],
  expenseType: [] as string[],
  name: "",
  matchedMenuItem: "",
  countList: [] as string[],
  locations: [],
};

export type ProductForm = typeof initialProductForm;

// Tanımlamalar > Ürünler formu: Product sayfası ve diğer sayfalardaki "yeni ürün oluştur" aynı alanları kullanır
export function useProductFormInputs({
  inputForm,
  isAddModalOpen,
  isEditModalOpen,
}: {
  inputForm: ProductForm;
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
}) {
  const { t } = useTranslation();
  const items = useGetMenuItems();
  const locations = useGetAllLocations();
  const expenseTypes = useGetAccountExpenseTypes();
  const brands = useGetAccountBrands();
  const countLists = useGetAccountCountLists();
  const vendors = useGetAccountVendors();

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "name",
        label: t("Name"),
        placeholder: t("Name"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "brand",
        label: t("Brand"),
        options: brands.map((brand) => ({
          value: brand._id,
          label: brand.name,
        })),
        isMultiple: true,
        placeholder: t("Brand"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "vendor",
        label: t("Vendor"),
        options: vendors.map((vendor) => ({
          value: vendor._id,
          label: vendor.name,
        })),
        isMultiple: true,
        placeholder: t("Vendor"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "expenseType",
        label: t("Expense Type"),
        options: expenseTypes.map((expenseType) => ({
          value: expenseType._id,
          label: expenseType.name,
        })),
        isMultiple: true,
        placeholder: t("Expense Type"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "countList",
        label: t("Count List"),
        options: countLists.map((countList) => ({
          value: countList._id,
          label: countList.name,
        })),
        placeholder: t("Count List"),
        isMultiple: true,
        required: false,
        isDisabled: isEditModalOpen,
      },
      {
        type: InputTypes.SELECT,
        formKey: "locations",
        label: t("Locations"),
        options: locations.map((location) => ({
          value: location._id,
          label: location.name,
        })),
        placeholder: t("Locations"),
        isMultiple: true,
        required: inputForm?.countList?.length > 0 && isAddModalOpen,
        isDisabled: inputForm?.countList?.length === 0 || isEditModalOpen,
      },
      {
        type: InputTypes.SELECT,
        formKey: "matchedMenuItem",
        label: t("Matched Menu Item"),
        options: items.map((item) => ({ value: item._id, label: item.name })),
        placeholder: t("Matched Menu Item"),
        required: false,
      },
    ],
    [t, expenseTypes, vendors, brands, items, inputForm, locations, countLists]
  );

  const formKeys = useMemo(
    () => [
      { key: "name", type: FormKeyTypeEnum.STRING },
      { key: "expenseType", type: FormKeyTypeEnum.STRING },
      { key: "vendor", type: FormKeyTypeEnum.STRING },
      { key: "brand", type: FormKeyTypeEnum.ARRAY },
      { key: "countList", type: FormKeyTypeEnum.ARRAY },
      { key: "locations", type: FormKeyTypeEnum.ARRAY },
      { key: "matchedMenuItem", type: FormKeyTypeEnum.STRING },
    ],
    []
  );

  return { inputs, formKeys };
}
