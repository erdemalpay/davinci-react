import { Authorization } from "../../types";
import { Paths, useGetList, useMutationApi } from "./factory";

const baseUrl = `${Paths.Authorization}`;
export function useAuthorizationMutations() {
  const { updateItem: updateAuthorization, createItem: createAuthorization } =
    useMutationApi<Authorization>({
      baseQuery: baseUrl,
    });
  return {
    updateAuthorization,
    createAuthorization,
  };
}

export function useGetAuthorizations() {
  return useGetList<Authorization>(baseUrl);
}
