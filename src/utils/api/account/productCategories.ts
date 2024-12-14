import { ProductCategories } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/product-categories`;

export function useProductCategoriesMutations() {
  const {
    deleteItem: deleteProductCategories,
    updateItem: updateProductCategories,
    createItem: createProductCategories,
  } = useMutationApi<ProductCategories>({
    isAdditionalInvalidate: true,
    baseQuery: baseUrl,
  });

  return {
    deleteProductCategories,
    updateProductCategories,
    createProductCategories,
  };
}

export function useGetProductCategories() {
  return useGetList<ProductCategories>(baseUrl);
}
