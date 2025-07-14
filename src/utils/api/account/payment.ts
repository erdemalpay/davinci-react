import { AccountPayment } from "../../../types";
import { Paths, useGetList, useMutationApi } from "../factory";
export class PaymentQueryFilter {
  after?: string;
  before?: string;
  date?: string;
}
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

export function useGetQueryPayments(filter: PaymentQueryFilter) {
  const url = `${Paths.Accounting}/payments/query?after=${
    filter.after || ""
  }&before=${filter.before || ""}&date=${filter.date || ""}`;
  return useGetList<AccountPayment>(
    `${url}`,
    [url, filter.after, filter.before, filter.date],
    true
  );
}
