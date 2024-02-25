import { useEffect, useState } from "react";
import { Header } from "../components/header/Header";
import { MenuCategory, MenuItem } from "../types";
import { useGetMenuItems } from "../utils/api/menu-item";

export interface ItemGroup {
  category: string;
  order: number;
  items: MenuItem[];
}

export default function MenuPage() {
  const items = useGetMenuItems();
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  useEffect(() => {
    const itemGroups: ItemGroup[] = [];
    if (!items) return;
    items.forEach((item) => {
      const category = item.category as MenuCategory;
      const existingGroup = itemGroups.find(
        (itemGroup) => itemGroup.category === category.name
      );
      if (existingGroup) {
        existingGroup.items.push(item);
      } else {
        const newGroup = {
          category: category.name,
          order: category.order,
          items: [item],
        };
        itemGroups.push(newGroup);
      }
    });
    itemGroups.sort((a, b) => (a.order > b.order ? 1 : -1));
    setItemGroups(itemGroups);
  }, [items]);
  return (
    <>
      <Header showLocationSelector={false} />
    </>
  );
}
