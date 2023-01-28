import { Membership } from "../../types/index";
import { Paths, useGet, useMutationApi } from "./factory";

export function useMembershipMutations() {
  const {
    deleteItem: deleteMembership,
    updateItem: updateMembership,
    createItem: createMembership,
  } = useMutationApi<Membership>({
    baseQuery: Paths.Memberships,
  });

  return { deleteMembership, updateMembership, createMembership };
}

export function useGetMemberships() {
  return useGet<Membership[]>(Paths.Memberships);
}
