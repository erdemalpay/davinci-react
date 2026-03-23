import { ActionEnum, DisabledCondition, User } from "../types";

export const isActionDisabled = (
  disabledCondition: DisabledCondition | undefined,
  action: ActionEnum,
  user: User | null | undefined
): boolean => {
  if (!disabledCondition) {
    return false;
  }

  return disabledCondition.actions.some(
    (ac) =>
      ac.action === action &&
      (user == null || !ac?.permissionsRoles?.includes(user?.role?._id))
  );
};
