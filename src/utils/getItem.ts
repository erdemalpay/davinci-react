import { MenuCategory, MenuItem } from "../types";

export function getRefId(
  ref: string | number | { _id: string | number }
): string | number {
  return typeof ref === "object" && ref !== null && "_id" in ref
    ? ref._id
    : ref;
}

export const getItem = <T extends { _id: any }>(
  _id: any,
  items: T[]
): T | undefined => {
  return items?.find((item: T) => item?._id === _id);
};

export function getMenuItemSubText(
  menuItem: MenuItem,
  category: MenuCategory | undefined,
  allMenuItems: MenuItem[]
): string | undefined {
  if (
    !category?.showItemProductionOnMenu ||
    !menuItem?.itemProduction ||
    menuItem.itemProduction.length === 0
  ) {
    return undefined;
  }

  const subProductNames = menuItem.itemProduction
    .map((prod) => {
      const subMenuItem = allMenuItems?.find(
        (item) => item.matchedProduct === prod.product
      );
      if (subMenuItem) {
        return `(${prod.quantity}X)  ${subMenuItem.name}`;
      }
      return null;
    })
    .filter(Boolean) as string[];

  if (subProductNames.length === 0) {
    return undefined;
  }

  return subProductNames.join("|||");
}

export function menuItemHasDecrementStock(
  item: MenuItem | undefined
): boolean {
  return item?.itemProduction?.some((p) => p.isDecrementStock) ?? false;
}
