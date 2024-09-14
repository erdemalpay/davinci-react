import { AccountPayment } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";

const baseUrl = `${Paths.Accounting}/payments`;
export function useAccountPaymentMutations() {
  const {
    deleteItem: deleteAccountPayment,
    updateItem: updateAccountPayment,
    createItem: createAccountPayment,
  } = useMutationApi<AccountPayment>({
    baseQuery: baseUrl,
  });

  return {
    deleteAccountPayment,
    updateAccountPayment,
    createAccountPayment,
  };
}

export function useGetAccountPayments() {
  return useGetList<AccountPayment>(baseUrl);
}
