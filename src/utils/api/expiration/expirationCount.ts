import { ExpirationCountType } from "../../../types/index";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Expiration}/counts`;
export function useExpirationCountMutations() {
  const {
    deleteItem: deleteExpirationCount,
    updateItem: updateExpirationCount,
    createItem: createExpirationCount,
  } = useMutationApi<ExpirationCountType>({
    baseQuery: baseUrl,
  });

  return {
    deleteExpirationCount,
    updateExpirationCount,
    createExpirationCount,
  };
}

export function useGetExpirationCounts() {
  return useGetList<ExpirationCountType>(baseUrl);
}
