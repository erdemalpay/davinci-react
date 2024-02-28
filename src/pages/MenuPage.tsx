import { useEffect, useState } from "react";
import { Header } from "../components/header/Header";
import MenuItemTable from "../components/menu/MenuItemTable";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { Tab } from "../components/panelComponents/shared/types";
import { MenuCategory, MenuItem } from "../types";
import { useGetMenuItems } from "../utils/api/menu-item";
export interface ItemGroup {
  category: MenuCategory;
  order: number;
  items: MenuItem[];
}

export default function MenuPage() {
  const [activeTab, setActiveTab] = useState<number>(0); // Reminder: I took this from tabpanel so that I can control the active tab from here
  const items = useGetMenuItems();
  const [tabPanelKey, setTabPanelKey] = useState<number>(0); //Reminder:I add this to force the tabpanel to rerender
  const [tabs, setTabs] = useState<Tab[]>([]);
  useEffect(() => {
    const itemGroups: ItemGroup[] = [];
    if (!items) return;
    items.forEach((item) => {
      const category = item.category as MenuCategory;
      const existingGroup = itemGroups.find(
        (itemGroup) => itemGroup.category.name === category.name
      );
      if (existingGroup) {
        existingGroup.items.push(item);
      } else {
        const newGroup = {
          category: category,
          order: category.order,
          items: [item],
        };
        itemGroups.push(newGroup);
      }
    });
    itemGroups.sort((a, b) => (a.order > b.order ? 1 : -1));
    setTabs(
      itemGroups.map((itemGroup) => ({
        number: itemGroup.order - 1,
        label: itemGroup.category.name,
        icon: null,
        content: (
          <MenuItemTable
            key={itemGroup.category.name}
            singleItemGroup={itemGroup}
          />
        ),
        isDisabled: false,
      }))
    );
    setTabPanelKey(tabPanelKey + 1);
  }, [items]);

  return (
    <>
      <Header showLocationSelector={false} />
      {tabs && (
        <TabPanel
          key={tabPanelKey}
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}
    </>
  );
}
