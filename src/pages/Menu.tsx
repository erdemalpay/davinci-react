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
import { getItem } from "../utils/getItem";

export interface ItemGroup {
  category: MenuCategory;
  order: number;
  items: MenuItem[];
}

export default function Menu() {
  const items = useGetMenuItems();
  const products = useGetAccountProducts();
  const popularItems = useGetPopularItems();
  const [isCategoryTabChanged, setIsCategoryTabChanged] = useState<boolean>();
  const [tableKeys, setTableKeys] = useState<number>(0); //Reminder:I add this to force the tabpanel to rerender
  const [tabs, setTabs] = useState<Tab[]>([]);
  const categories = useGetCategories();
  const seenCategories: { [key: string]: boolean } = {};
  const {
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setExpandedRows,
    setSearchQuery,
    menuActiveTab,
    setMenuActiveTab,
  } = useGeneralContext();
  const handleCategoryChange = () => {
    setIsCategoryTabChanged(true);
  };
  const handleTabChange = () => {
    const itemCategories = items
      .map((item) => item.category)
      .filter((category) => {
        if (seenCategories.hasOwnProperty(category)) {
          return false;
        } else {
          seenCategories[category] = true;
          return true;
        }
      })
      .sort(
        (a, b) =>
          (getItem(a, categories)?.order as number) -
          (getItem(b, categories)?.order as number)
      );
    const emptyCategories = categories?.filter(
      (category) =>
        itemCategories.filter((itemCategory) => itemCategory === category?._id)
          .length === 0
    );
    const itemGroups: ItemGroup[] = [];
    if (!items) return;
    items.forEach((item) => {
      const category = getItem(item.category, categories);
      const existingGroup = itemGroups.find(
        (itemGroup) => itemGroup.category?.name === category?.name
      );
      if (existingGroup) {
        existingGroup.items.push(item);
      } else {
        const newGroup = {
          category: category as MenuCategory,
          order: category?.order as number,
          items: [item],
        };
        itemGroups.push(newGroup);
      }
    });
    itemGroups.sort((a, b) => (a.order > b.order ? 1 : -1));
    setTabs(
      [
        ...itemGroups?.map((itemGroup, index) => ({
          number: index,
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
          ? emptyCategories?.map((category, index) => ({
              number: itemGroups?.length + index,
              label: category.name,
              icon: null,
              content: (
                <MenuItemTable
                  key={category.name + tableKeys + category.locations?.length}
                  singleItemGroup={{
                    category,
                    order: category.order,
                    items: [],
                  }}
                  popularItems={popularItems}
                  products={products}
                />
              ),
              isDisabled: false,
            }))
          : []),
        {
          number: itemCategories?.length + emptyCategories?.length,
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
          number: itemCategories?.length + emptyCategories?.length + 1,
          label: "Categories",
          icon: null,
          content: (
            <CategoryTable
              key={"categories" + tableKeys}
              categories={categories as MenuCategory[]}
              handleCategoryChange={handleCategoryChange}
            />
          ),
          isDisabled: false,
        },
      ].sort((a, b) => a.number - b.number)
    );
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
        tabs={tabs}
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
