import { ProductCategories } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/product-categories`;

export function useIkasCategoriesMutations() {
  const {
    deleteItem: deleteIkasCategories,
    updateItem: updateIkasCategories,
    createItem: createIkasCategories,
  } = useMutationApi<ProductCategories>({
    isAdditionalInvalidate: true,
    baseQuery: baseUrl,
  });

  return {
    deleteProductCategories: deleteIkasCategories,
    updateProductCategories: updateIkasCategories,
    createProductCategories: createIkasCategories,
  };
}

export function useGetIkasCategories() {
  return useGetList<ProductCategories>(baseUrl);
}

export function useShopifyCategoriesMutations() {
  const {
    deleteItem: deleteShopifyCategories,
    updateItem: updateShopifyCategories,
    createItem: createShopifyCategories,
  } = useMutationApi<ProductCategories>({
    isAdditionalInvalidate: true,
    baseQuery: baseUrl,
  });

  return {
    deleteShopifyCategories,
    updateShopifyCategories,
    createShopifyCategories,
  };
}

export function useGetShopifyCategories() {
  return useGetList<ProductCategories>(baseUrl);
}
