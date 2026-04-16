import { t } from "i18next";
import { useEffect, useState } from "react";
import { Header } from "../components/header/Header";
import CategoryTable from "../components/menu/CategoryTable";
import ClosedItems from "../components/menu/ClosedItems";
import CustomerPopupTable from "../components/menu/CustomerPopupTable";
import ItemPage from "../components/menu/ItemPage";
import MenuItemTable from "../components/menu/MenuItemTable";
import PopularTable from "../components/menu/PopularTable";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import { Tab } from "../components/panelComponents/shared/types";
import { useGeneralContext } from "../context/General.context";
import { MenuCategory, MenuItem } from "../types";
import { useGetAccountProducts } from "../utils/api/account/product";
import { useGetAllCategories } from "../utils/api/menu/category";
import { useGetMenuItems } from "../utils/api/menu/menu-item";
import { useGetPopularItems } from "../utils/api/menu/popular";
import { getItem } from "../utils/getItem";
import { getMenuItemCategoryIds } from "../utils/menuItemCategories";
import OrderCategoryOrder from "./OrderCategoryOrder";
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
  const categories = useGetAllCategories();
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
    const usedCategoryIds = new Set<number>();
    if (items) {
      for (const item of items) {
        for (const cid of getMenuItemCategoryIds(item)) {
          usedCategoryIds.add(cid);
        }
      }
    }
    const itemCategories = [...usedCategoryIds].sort((a, b) => {
      const orderA = getItem(a, categories)?.order ?? 0;
      const orderB = getItem(b, categories)?.order ?? 0;
      return orderA - orderB;
    });

    const emptyCategories = categories?.filter(
      (category) => !usedCategoryIds.has(category?._id)
    );
    const itemGroups: ItemGroup[] = [];
    if (!items) return;
    const groupByCategoryId = new Map<number, MenuItem[]>();
    for (const item of items) {
      for (const categoryId of getMenuItemCategoryIds(item)) {
        const category = getItem(categoryId, categories);
        if (!category?.active && !category?.isKitchenMenu) continue;
        const list = groupByCategoryId.get(categoryId);
        if (list) list.push(item);
        else groupByCategoryId.set(categoryId, [item]);
      }
    }
    for (const [categoryId, groupItems] of groupByCategoryId) {
      const category = getItem(categoryId, categories);
      if (!category) continue;
      itemGroups.push({
        category: category as MenuCategory,
        order: category.order,
        items: groupItems,
      });
    }
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
        {
          number: itemCategories?.length + emptyCategories?.length + 3,
          label: t("Order Categories Order"),
          icon: null,
          content: <OrderCategoryOrder />,
          isDisabled: false,
        },
        {
          number: itemCategories?.length + emptyCategories?.length + 4,
          label: t("Customer Popups"),
          icon: null,
          content: <CustomerPopupTable />,
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
