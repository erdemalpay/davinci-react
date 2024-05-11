import { useEffect, useState } from "react";
import { Header } from "../components/header/Header";
import CategoryTable from "../components/menu/CategoryTable";
import MenuItemTable from "../components/menu/MenuItemTable";
import PopularTable from "../components/menu/PopularTable";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import { Tab } from "../components/panelComponents/shared/types";
import { useGeneralContext } from "../context/General.context";
import { MenuCategory, MenuItem } from "../types";
import { useGetAccountProducts } from "../utils/api/account/product";
import { useGetCategories } from "../utils/api/menu/category";
import { useGetMenuItems } from "../utils/api/menu/menu-item";
import { useGetPopularItems } from "../utils/api/menu/popular";

export interface ItemGroup {
  category: MenuCategory;
  order: number;
  items: MenuItem[];
}

export default function Menu() {
  const items = useGetMenuItems();
  const products = useGetAccountProducts();
  const popularItems = useGetPopularItems();
  const [tableKeys, setTableKeys] = useState<number>(0); //Reminder:I add this to force the tabpanel to rerender
  const [tabs, setTabs] = useState<Tab[]>([]);
  const categories = useGetCategories();
  const seenCategories: { [key: string]: boolean } = {};
  const {
    isCategoryTabChanged,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setExpandedRows,
    setSearchQuery,
    menuActiveTab,
    setMenuActiveTab,
    setIsCategoryTabChanged,
  } = useGeneralContext();
  const handleTabChange = () => {
    const itemCategories = items
      .map((item) => item.category)
      .filter((category) => {
        if (seenCategories.hasOwnProperty((category as MenuCategory)?._id)) {
          return false;
        } else {
          seenCategories[(category as MenuCategory)?._id] = true;
          return true;
        }
      })
      .sort((a, b) => (a as MenuCategory)?.order - (b as MenuCategory)?.order);
    const emptyCategories = categories?.filter(
      (category) =>
        itemCategories.filter(
          (itemCategory) =>
            (itemCategory as MenuCategory)?._id === category?._id
        ).length === 0
    );
    const itemGroups: ItemGroup[] = [];
    if (!items) return;
    items.forEach((item) => {
      const category = item.category as MenuCategory;
      const existingGroup = itemGroups.find(
        (itemGroup) => itemGroup.category?.name === category?.name
      );
      if (existingGroup) {
        existingGroup.items.push(item);
      } else {
        const newGroup = {
          category: category,
          order: category?.order,
          items: [item],
        };
        itemGroups.push(newGroup);
      }
    });
    itemGroups.sort((a, b) => (a.order > b.order ? 1 : -1));
    setTabs([
      ...itemGroups.map((itemGroup) => ({
        number: itemGroup.category?.order - 1,
        label: itemGroup.category?.name,
        icon: null,
        content: (
          <MenuItemTable
            key={
              itemGroup.category?.name +
              tableKeys +
              itemGroup.category?.locations.length
            }
            singleItemGroup={itemGroup}
            popularItems={popularItems}
            products={products}
          />
        ),
        isDisabled: false,
      })),

      ...(emptyCategories.length > 0
        ? emptyCategories.map((category) => ({
            number: (category.order ?? emptyCategories.length) - 1,
            label: category.name,
            icon: null,
            content: (
              <MenuItemTable
                key={category.name + tableKeys + category.locations?.length}
                singleItemGroup={{ category, order: category.order, items: [] }}
                popularItems={popularItems}
                products={products}
              />
            ),
            isDisabled: false,
          }))
        : []),
      {
        number: itemCategories.length + emptyCategories.length,
        label: "Popular",
        icon: null,
        content: (
          <PopularTable
            key={"popular" + tableKeys}
            popularItems={popularItems}
          />
        ),
        isDisabled: false,
      },
      {
        number: itemCategories.length + emptyCategories.length + 1,
        label: "Categories",
        icon: null,
        content: (
          <CategoryTable
            key={"categories" + tableKeys}
            categories={categories as MenuCategory[]}
          />
        ),
        isDisabled: false,
      },
    ]);
    setTableKeys(tableKeys + 1);
  };

  useEffect(() => {
    handleTabChange();
  }, [
    items,
    currentPage,
    menuActiveTab,
    rowsPerPage,
    popularItems,
    products,
    categories,
  ]);
  return (
    <>
      <Header showLocationSelector={false} />
      <TabPanel
        tabs={tabs.sort((a, b) => a.number - b.number)}
        activeTab={menuActiveTab}
        setActiveTab={setMenuActiveTab}
        additionalOpenAction={() => {
          if (!isCategoryTabChanged) {
            setCurrentPage(1);
            setExpandedRows({});
            setSearchQuery("");
          }
          setIsCategoryTabChanged(false);
        }}
      />
    </>
  );
}
