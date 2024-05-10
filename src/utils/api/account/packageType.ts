import { AccountPackageType } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/package-types`;

export function useAccountPackageTypeMutations() {
  const {
    deleteItem: deleteAccountPackageType,
    updateItem: updateAccountPackageType,
    createItem: createAccountPackageType,
  } = useMutationApi<AccountPackageType>({
    baseQuery: baseUrl,
    additionalInvalidates: [[`${Paths.Accounting}/invoices`]],
  });

  return {
    deleteAccountPackageType,
    updateAccountPackageType,
    createAccountPackageType,
  };
}

export function useGetAccountPackageTypes() {
  return useGetList<AccountPackageType>(baseUrl);
}
