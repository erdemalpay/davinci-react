import { AccountPaymentMethod } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/payment-methods`;
export function useAccountPaymentMethodMutations() {
  const {
    deleteItem: deleteAccountPaymentMethod,
    updateItem: updateAccountPaymentMethod,
    createItem: createAccountPaymentMethod,
  } = useMutationApi<AccountPaymentMethod>({
    baseQuery: baseUrl,
    additionalInvalidates: [
      [`${Paths.Accounting}/invoices`],
      [`${Paths.Accounting}/fixture-invoice`],
      [`${Paths.Accounting}/service-invoice`],
    ],
  });

  return {
    deleteAccountPaymentMethod,
    updateAccountPaymentMethod,
    createAccountPaymentMethod,
  };
}

export function useGetAccountPaymentMethods() {
  return useGetList<AccountPaymentMethod>(baseUrl);
}
