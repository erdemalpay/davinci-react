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
