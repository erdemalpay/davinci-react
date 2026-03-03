import { RoleEnum, User } from "../types";

export const isDisabledConditionCreateNotification = (user: User | null | undefined): boolean => {
  return user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true;
};

export const isDisabledConditionCountList = (user: User | null | undefined): boolean => {
  return user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true;
};

export const isDisabledConditionExpirationList = (user: User | null | undefined): boolean => {
  return user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true;
};

export const isDisabledConditionSingleCountArchive = (user: User | null | undefined): boolean => {
  return user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true;
};

export const isDisabledConditionUsers = (user: User | null | undefined): boolean => {
  return user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true;
};