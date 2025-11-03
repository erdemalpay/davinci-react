import { t } from "i18next";
import { useEffect, useState } from "react";
import { Header } from "../components/header/Header";
import CategoryTable from "../components/menu/CategoryTable";
import ClosedItems from "../components/menu/ClosedItems";
import ItemPage from "../components/menu/ItemPage";
import MenuItemTable from "../components/menu/MenuItemTable";
import PopularTable from "../components/menu/PopularTable";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
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
  const { selectedMenuItem } = useGeneralContext();
  const popularItems = useGetPopularItems();
  const [isCategoryTabChanged, setIsCategoryTabChanged] = useState<boolean>();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const categories = useGetCategories();
  const {
    currentPage,
    rowsPerPage,
    resetGeneralContext,
    menuActiveTab,
    setMenuActiveTab,
  } = useGeneralContext();
  const handleCategoryChange = () => {
    setIsCategoryTabChanged(true);
  };
  const handleTabChange = () => {
    const seenCategories = new Set<number>();
    const itemCategories = items
      .map((item) => item.category)
      .filter((category): category is number => {
        if (seenCategories.has(category)) {
          return false;
        }
        seenCategories.add(category);
        return true;
      })
      .sort((a, b) => {
        const orderA = getItem(a, categories)?.order ?? 0;
        const orderB = getItem(b, categories)?.order ?? 0;
        return orderA - orderB;
      });

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
      } else if (category?.active) {
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
        ...(itemGroups ?? []).map((itemGroup, index) => ({
          number: index,
          label: itemGroup.category?.name ?? "",
          icon: null,
          content: (
            <MenuItemTable
              singleItemGroup={itemGroup}
              popularItems={popularItems}
            />
          ),
          isDisabled: false,
        })),
        ...(emptyCategories.length > 0
          ? emptyCategories.map((category, index) => ({
              number: (itemGroups?.length ?? 0) + index,
              label: category.name,
              icon: null,
              content: (
                <MenuItemTable
                  singleItemGroup={{
                    category,
                    order: category.order,
                    items: [],
                  }}
                  popularItems={popularItems}
                />
              ),
              isDisabled: false,
            }))
          : []),
        {
          number: itemCategories?.length + emptyCategories?.length,
          label: "Popular",
          icon: null,
          content: <PopularTable popularItems={popularItems} />,
          isDisabled: false,
        },
        {
          number: itemCategories?.length + emptyCategories?.length + 1,
          label: t("Closed Items"),
          icon: null,
          content: <ClosedItems />,
          isDisabled: false,
        },
        {
          number: itemCategories?.length + emptyCategories?.length + 2,
          label: t("Categories"),
          icon: null,
          content: (
            <CategoryTable handleCategoryChange={handleCategoryChange} />
          ),
          isDisabled: false,
        },
      ].sort((a, b) => a.number - b.number)
    );
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
  if (selectedMenuItem) {
    return <ItemPage />;
  }
  return (
    <>
      <Header showLocationSelector={false} />
      <UnifiedTabPanel
        tabs={tabs}
        activeTab={menuActiveTab}
        setActiveTab={setMenuActiveTab}
        isLanguageChange={false}
        additionalOpenAction={() => {
          if (!isCategoryTabChanged) {
            resetGeneralContext();
          }
          setIsCategoryTabChanged(false);
        }}
        allowOrientationToggle={true}
      />
    </>
  );
}
