import { ExpirationListType } from "../../../types/index";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Expiration}/lists`;
export function useExpirationListMutations() {
  const {
    deleteItem: deleteExpirationList,
    updateItem: updateExpirationList,
    createItem: createExpirationList,
  } = useMutationApi<ExpirationListType>({
    baseQuery: baseUrl,
  });

  return {
    deleteExpirationList,
    updateExpirationList,
    createExpirationList,
  };
}

export function useGetExpirationLists() {
  return useGetList<ExpirationListType>(baseUrl);
}
