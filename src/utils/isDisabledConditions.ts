import { RoleEnum, User } from "../types";

export const isDisabledConditionBrand = (user: User | null | undefined): boolean => {
  return user
    ? ![RoleEnum.MANAGER, RoleEnum.GAMEMANAGER, RoleEnum.OPERATIONSASISTANT].includes(user?.role?._id)
    : true;
};

export const isDisabledConditionGameStock = (user: User | null | undefined): boolean => {
  return user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true;
};

export const isDisabledConditionCountListMenu = (user: User | null | undefined): boolean => {
  return user ? ![RoleEnum.MANAGER, RoleEnum.OPERATIONSASISTANT].includes(user?.role?._id) : true;
};

export const isDisabledConditionCountLists = (user: User | null | undefined): boolean => {
  return user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true;
};

export const isDisabledConditionExpirationLists = (user: User | null | undefined): boolean => {
  return user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true;
};

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