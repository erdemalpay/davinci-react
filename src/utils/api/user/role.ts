import { Role } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const roleBaseUrl = `${Paths.Users}/roles`;

export const useGetRoles = () => {
  return useGetList<Role>(roleBaseUrl);
};

export const useRoleMutations = () => {
  const { createItem, updateItem } = useMutationApi<Role>({
    baseQuery: roleBaseUrl,
    queryKey: [roleBaseUrl],
  });

  return {
    createRole: createItem,
    updateRole: updateItem,
  };
};
