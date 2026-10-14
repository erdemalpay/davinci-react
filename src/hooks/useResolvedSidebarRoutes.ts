import { useMemo } from "react";
import { useDataContext } from "../context/Data.context";
import { Routes } from "../navigation/constants";
import type { Tab } from "../components/panelComponents/shared/types";
import { useFilteredRoutes } from "./useFilteredRoutes";
import type { SidebarRouteItem } from "./useSidebarNavigation";

export function useResolvedSidebarRoutes(): SidebarRouteItem[] {
  const rawRoutes = useFilteredRoutes() as SidebarRouteItem[];
  const { kitchens, categories } = useDataContext();

  return useMemo(() => {
    let routes = rawRoutes;

    if (kitchens?.length) {
      const kitchenTabs: Tab[] = kitchens.map((kitchen, index) => ({
        number: index,
        label: kitchen.name,
        content: null,
        isDisabled: false,
      }));

      routes = routes.map((route) =>
        route.path === Routes.Orders ? { ...route, tabs: kitchenTabs } : route
      );
    }

    if (categories?.length) {
      const categoryTabs: Tab[] = [...categories]
        .filter((category) => category.active || category.isKitchenMenu)
        .sort((a, b) => a.order - b.order)
        .map((category, index) => ({
          number: index,
          label: category.name,
          content: null,
          isDisabled: false,
        }));
      const extraTabLabels = [
        "Popular",
        "Closed Items",
        "Categories",
        "Order Categories Order",
        "Customer Popups",
      ];
      const menuTabs: Tab[] = [
        ...categoryTabs,
        ...extraTabLabels.map((label, index) => ({
          number: categoryTabs.length + index,
          label,
          content: null,
          isDisabled: false,
        })),
      ];

      routes = routes.map((route) =>
        route.path === Routes.Menu && route.children
          ? {
              ...route,
              children: route.children.map((child) =>
                child.path === Routes.Menu
                  ? { ...child, tabs: menuTabs }
                  : child
              ),
            }
          : route
      );
    }

    return routes;
  }, [categories, kitchens, rawRoutes]);
}
