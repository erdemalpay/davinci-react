import { CustomerPopup } from "../../../types/index";
import { Paths, useGetList, useMutationApi } from "../factory";

export const CustomerPopupPath = `${Paths.Menu}/customer-popup`;

export function useCustomerPopupMutations() {
  const {
    createItem: createCustomerPopup,
    updateItem: updateCustomerPopup,
    deleteItem: deleteCustomerPopup,
  } = useMutationApi<CustomerPopup>({
    baseQuery: CustomerPopupPath,
  });

  return { createCustomerPopup, updateCustomerPopup, deleteCustomerPopup };
}

export function useGetCustomerPopups() {
  return useGetList<CustomerPopup>(CustomerPopupPath);
}

export function useGetActiveCustomerPopups(locationId: number | undefined) {
  return useGetList<CustomerPopup>(
    `${CustomerPopupPath}/active?location=${locationId ?? ""}`,
    [`${CustomerPopupPath}/active`, locationId],
    false,
    { enabled: locationId !== undefined }
  );
}
