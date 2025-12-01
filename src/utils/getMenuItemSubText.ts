import { MenuItem, MenuCategory } from "../types";

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
