import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Header } from "../components/header/Header";
import CategoryTable from "../components/menu/CategoryTable";
import MenuItemTable from "../components/menu/MenuItemTable";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { Tab } from "../components/panelComponents/shared/types";
import { useGeneralContext } from "../context/General.context";
import { MenuCategory, MenuItem } from "../types";
import { useGetCategories } from "../utils/api/category";
import { useGetMenuItems } from "../utils/api/menu-item";

export interface ItemGroup {
  category: MenuCategory;
  order: number;
  items: MenuItem[];
}

export default function MenuPage() {
  const [activeTab, setActiveTab] = useState<number>(0); // Reminder: I took this from tabpanel so that I can control the active tab from here
  const items = useGetMenuItems();
  const [tableKeys, setTableKeys] = useState<number>(0); //Reminder:I add this to force the tabpanel to rerender
  const [tabPanelKey, setTabPanelKey] = useState<number>(0); //Reminder:I add this to force the tabpanel to rerender
  const [tabs, setTabs] = useState<Tab[]>([]);
  const categories = useGetCategories();
  const seenCategories: { [key: string]: boolean } = {};
  const { currentPage, setCurrentPage, rowsPerPage, setRowsPerPage } =
    useGeneralContext();
  const [categoryPageChanged, setCategoryPageChanged] = useState(false);
  const queryClient = useQueryClient();
  const itemCategories = items
    .map((item) => item.category)
    .filter((category) => {
      if (seenCategories.hasOwnProperty((category as MenuCategory)._id)) {
        return false;
      } else {
        seenCategories[(category as MenuCategory)._id] = true;
        return true;
      }
    })
    .sort((a, b) => (a as MenuCategory).order - (b as MenuCategory).order);
  const emptyCategories = categories.filter(
    (category) =>
      itemCategories.filter(
        (itemCategory) => (itemCategory as MenuCategory)._id === category._id
      ).length === 0
  );

  const handleTabChange = () => {
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

    setTabs([
      ...itemGroups.map((itemGroup) => ({
        number: itemGroup.category.order - 1,
        label: itemGroup.category.name,
        icon: null,
        content: (
          <MenuItemTable
            key={itemGroup.category.name + tableKeys}
            singleItemGroup={itemGroup}
          />
        ),
        isDisabled: false,
      })),

      ...(emptyCategories.length > 0
        ? emptyCategories.map((category) => ({
            number: category.order - 1,
            label: category.name,
            icon: null,
            content: (
              <MenuItemTable
                key={category.name + tableKeys}
                singleItemGroup={{ category, order: category.order, items: [] }}
              />
            ),
            isDisabled: false,
          }))
        : []),
      {
        number: itemCategories.length + emptyCategories.length,
        label: "Categories",
        icon: null,
        content: <CategoryTable categories={categories as MenuCategory[]} />,
        isDisabled: false,
      },
    ]);

    setTableKeys(tableKeys + 1);
  };
  useEffect(() => {
    setCategoryPageChanged(true);
    setTabPanelKey((prev) => prev + 1);
  }, [categories]);

  useEffect(() => {
    handleTabChange();
  }, [categories, items, currentPage, activeTab, rowsPerPage]);

  return (
    <>
      <Header showLocationSelector={false} />
      {tabs && (
        <TabPanel
          key={tabPanelKey}
          tabs={tabs.sort((a, b) => a.number - b.number)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          additionalOpenAction={() => {
            if (!categoryPageChanged) {
              setCurrentPage(1);
            }
            setCategoryPageChanged(false);
          }}
        />
      )}
    </>
  );
}
