import { RoleEnum, User } from "../types";

//isDisabled kullanılan komponentlerin çoğunda sadece manager rolü kontrolü olduğu için, bu komponentlerde kullanmak için generic bir isDisabledConditionManagerOnly tanımlayıp o komponentlerde bunu kullandım.
//Diğer komponentlerde, daha spesifik yetki kontrolleri için custom fonksiyonlar yazdım.
//şu anda sadece manager kontrolü olan komponentlerde; ileride başka roller için yetkilendirme gerekirse, o komponent için özel bir fonksiyon yazılıp, oradaki kullanımlar değiştirilebilir.

export const isDisabledConditionManagerOnly = (user: User | null | undefined): boolean => {
  return user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true;
};

export const isDisabledConditionBrand = (user: User | null | undefined): boolean => {
  return user
    ? ![RoleEnum.MANAGER, RoleEnum.GAMEMANAGER, RoleEnum.OPERATIONSASISTANT].includes(user?.role?._id)
    : true;
};

export const isDisabledConditionCountListMenu = (user: User | null | undefined): boolean => {
  return user ? ![RoleEnum.MANAGER, RoleEnum.OPERATIONSASISTANT].includes(user?.role?._id) : true;
};