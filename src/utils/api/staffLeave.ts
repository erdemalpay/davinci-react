import { StaffLeave, StaffLeaveType } from "../../types";
import { Paths, useGetList, useMutationApi } from "./factory";

const typesBaseUrl = `${Paths.StaffLeave}/types`;

export function useStaffLeaveTypeMutations() {
  const { createItem: createStaffLeaveType, updateItem: updateStaffLeaveType } =
    useMutationApi<StaffLeaveType>({ baseQuery: typesBaseUrl });
  return { createStaffLeaveType, updateStaffLeaveType };
}

export function useGetStaffLeaveTypes() {
  return useGetList<StaffLeaveType>(typesBaseUrl);
}

export function useStaffLeaveMutations(after: string, before: string) {
  const {
    createItem: createStaffLeave,
    updateItem: updateStaffLeave,
    deleteItem: deleteStaffLeave,
  } = useMutationApi<StaffLeave>({
    baseQuery: Paths.StaffLeave,
    queryKey: [Paths.StaffLeave, after, before],
  });
  return { createStaffLeave, updateStaffLeave, deleteStaffLeave };
}

export function useGetStaffLeaves(after: string, before: string) {
  return useGetList<StaffLeave>(
    `${Paths.StaffLeave}?after=${after}&before=${before}`,
    [Paths.StaffLeave, after, before],
    true
  );
}
