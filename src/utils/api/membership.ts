import { Membership } from "../../types/index";
import { Paths, useGetList, useMutationApi } from "./factory";

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
  return useGetList<Membership>(Paths.Memberships);
}
