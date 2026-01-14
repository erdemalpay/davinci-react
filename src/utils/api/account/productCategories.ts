import { ProductCategories as IkasCategories } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/product-categories`;

export function useIkasCategoriesMutations() {
  const {
    deleteItem: deleteIkasCategories,
    updateItem: updateIkasCategories,
    createItem: createIkasCategories,
  } = useMutationApi<IkasCategories>({
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
  return useGetList<IkasCategories>(baseUrl);
}

export function useShopifyCollectionsMutations() {
  const {
    deleteItem: deleteShopifyCollections,
    updateItem: updateShopifyCollections,
    createItem: createShopifyCollections,
  } = useMutationApi<IkasCategories>({
    isAdditionalInvalidate: true,
    baseQuery: baseUrl,
  });

  return {
    deleteShopifyCollections: deleteShopifyCollections,
    updateShopifyCollections: updateShopifyCollections,
    createShopifyCollections: createShopifyCollections,
  };
}

export function useGetShopifyCollections() {
  return useGetList<IkasCategories>(baseUrl);
}
