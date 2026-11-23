import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import { useGetCategories } from "../utils/api/menu/category";

// Tanımlamalar > Ürünler satırındaki "+" (menü ürünü ekle) formu: Product sayfası ve "yeni ürün oluştur" sonrası aynı alanları kullanır
export function useMenuItemFormInputs() {
  const { t } = useTranslation();
  const categories = useGetCategories();

  const menuItemInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "category",
        label: t("Category"),
        options: categories.map((category) => ({
          value: category._id,
          label: category.name,
        })),
        placeholder: t("Category"),
        required: true,
      },
      {
        type: InputTypes.TEXTAREA,
        formKey: "description",
        label: t("Description"),
        placeholder: t("Description"),
        required: false,
      },
      {
        type: InputTypes.NUMBER,
        formKey: "price",
        label: `${t("Price")}`,
        placeholder: `${t("Price")}`,
        required: true,
      },
      {
        type: InputTypes.NUMBER,
        formKey: "onlinePrice",
        label: `${t("Online Price")}`,
        placeholder: `${t("Online Price")}`,
        required: false,
      },
      {
        type: InputTypes.IMAGE,
        formKey: "imageUrl",
        label: "Image",
        required: false,
        folderName: "menu",
      },
    ],
    [t, categories]
  );

  const menuItemFormKeys = useMemo(
    () => [
      { key: "category", type: FormKeyTypeEnum.STRING },
      { key: "description", type: FormKeyTypeEnum.STRING },
      { key: "price", type: FormKeyTypeEnum.NUMBER },
      { key: "onlinePrice", type: FormKeyTypeEnum.NUMBER },
      { key: "imageUrl", type: FormKeyTypeEnum.STRING },
    ],
    []
  );

  return { inputs: menuItemInputs, formKeys: menuItemFormKeys };
}

// Ürün menüye eklenirken hazır gelen alanlar: Tanımlamalar > Ürünler "+" ve "yeni ürün oluştur" aynısını kullanır
export const menuItemDefaultsFor = (product: {
  _id: string;
  name: string;
}) => ({
  name: product.name,
  locations: [1, 2],
  matchedProduct: product._id,
});
