import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Cookies from "js-cookie";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { useFilteredRoutes } from "./useFilteredRoutes";
import { Role } from "../types";
import { useGetBreaksByDate } from "../utils/api/break";
import { useGetGameplayTimesByDate } from "../utils/api/gameplaytime";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";
import { useGetUser } from "../utils/api/user";
import { clearLocalStoragePreservingOnboarding } from "../utils/onboardingStorage";
import { getTabSlug } from "../utils/slug";
import { usernamify } from "../utils/string";
import { Tab } from "../components/panelComponents/shared/types";

export type SidebarRouteItem = {
  name: string;
  path?: string;
  link?: string;
  isOnSidebar?: boolean;
  exceptionalRoles?: number[];
  tabs?: Tab[];
  children?: SidebarRouteItem[];
};

export type MenuOption = {
  value: string;
  label: string;
};

type MenuOptionEntry = {
  label: string;
  path: string;
  link?: string;
  tabSlug?: string;
};

export function useSidebarNavigation(onClose: () => void) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const { setUser } = useUserContext();
  const { resetGeneralContext, setIsLogoutModalOpen } = useGeneralContext();

  const user = useGetUser();
  const routes = useFilteredRoutes() as SidebarRouteItem[];
  const pages = useGetPanelControlPages();

  const todayDate = format(new Date(), "yyyy-MM-dd");
  const activeBreaks = useGetBreaksByDate(todayDate);
  const activeGameplayTimes = useGetGameplayTimesByDate(todayDate);

  const [openGroups, setOpenGroups] = useState<{ [group: string]: boolean }>({});
  const [searchValue, setSearchValue] = useState("");

  const currentRoute = location.pathname;

  const userActiveBreak = activeBreaks?.find(
    (b) =>
      (typeof b.user === "string" ? b.user : b.user._id) === user?._id &&
      !b.finishHour
  );

  const userActiveGameplayTime = activeGameplayTimes?.find(
    (g) =>
      (typeof g.user === "string" ? g.user : g.user._id) === user?._id &&
      !g.finishHour
  );

  const hasActiveSession = !!(userActiveBreak || userActiveGameplayTime);

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      if (next[groupName]) {
        delete next[groupName];
      } else {
        next[groupName] = true;
      }
      return next;
    });
  };

  const getActiveTab = () => new URLSearchParams(location.search).get("tab");

  const getAllowedTabs = useCallback(
    (item: SidebarRouteItem): Tab[] => {
      if (!item.tabs || item.tabs.length === 0) return [];

      // Try multiple strategies to find matching panel-control page:
      // 1. _id exactly equals transformed item.name via usernamify
      // 2. _id equals path-based id (strip leading slash and replace - with _)
      // 3. name equals item.name
      const pathBasedId = item.path
        ? item.path.replace(/^\//, "").replace(/-/g, "_")
        : null;

      const controlPage =
        pages?.find((p) => p._id === usernamify(item.name)) ||
        (pathBasedId ? pages?.find((p) => p._id === pathBasedId) : undefined) ||
        pages?.find((p) => p.name === item.name);

      const controlTabs = (controlPage?.tabs as {
        name: string;
        permissionRoles?: number[];
      }[]) ?? [];

      return item.tabs.filter(
        (ct) =>
          !!controlTabs.find(
            (pt) =>
              pt.name === ct.label &&
              pt.permissionRoles?.includes((user?.role as Role)?._id)
          )
      );
    },
    [pages, user]
  );

  const getFilteredChildren = useCallback(
    (route: SidebarRouteItem) =>
      route.children?.filter(
        (child) =>
          child.exceptionalRoles?.includes((user?.role as Role)?._id) ||
          pages?.some(
            (page) =>
              page.name === child.name &&
              page.permissionRoles?.includes((user?.role as Role)?._id)
          )
      ),
    [pages, user]
  );

  const handleRouteNavigation = (item: SidebarRouteItem) => {
    if (item.link) {
      window.location.href = item.link;
      return;
    }

    if (!item.path) return;

    resetGeneralContext();

    const allowedTabs = getAllowedTabs(item);

    if (allowedTabs.length > 0) {
      navigate(`${item.path}?tab=${getTabSlug(allowedTabs[0].label)}`);
    } else {
      navigate(item.path);
    }

    window.scrollTo(0, 0);
    onClose();
  };

  const menuOptionsList = useMemo<MenuOptionEntry[]>(() => {
    const list: MenuOptionEntry[] = [];

    routes.forEach((route) => {
      const filteredChildren = getFilteredChildren(route);

      const pushWithTabs = (item: SidebarRouteItem) => {
        list.push({
          label: t(item.name),
          path: item.path || "",
          link: item.link,
        });

        getAllowedTabs(item).forEach((tab) => {
          list.push({
            label: `${t(item.name)} / ${t(tab.label)}`,
            path: item.path || "",
            tabSlug: getTabSlug(tab.label),
          });
        });
      };

      if (filteredChildren && filteredChildren.length > 1) {
        filteredChildren.filter((c) => c.isOnSidebar).forEach(pushWithTabs);
      } else if (filteredChildren && filteredChildren.length === 1) {
        const child = filteredChildren[0];
        if (child.isOnSidebar) pushWithTabs(child);
      } else if (route.isOnSidebar) {
        pushWithTabs(route);
      }
    });

    return list;
  }, [routes, getFilteredChildren, getAllowedTabs, t]);

  const menuOptions = useMemo<MenuOption[]>(() => {
    const seenLabels = new Set<string>();
    return menuOptionsList
      .filter((item) => {
        if (seenLabels.has(item.label)) return false;
        seenLabels.add(item.label);
        return true;
      })
      .map((item) => ({ value: item.label, label: item.label }));
  }, [menuOptionsList]);

  const handleMenuSelect = (value: string) => {
    const selected = menuOptionsList.find((opt) => opt.label === value);

    if (selected) {
      if (selected.link) {
        window.location.href = selected.link;
      } else if (selected.path) {
        resetGeneralContext();

        if (selected.tabSlug) {
          navigate(`${selected.path}?tab=${selected.tabSlug}`);
        } else {
          navigate(selected.path);
        }

        window.scrollTo(0, 0);
        onClose();
      }
    }

    setSearchValue(value);
  };

  const logout = () => {
    clearLocalStoragePreservingOnboarding();
    localStorage.setItem("loggedOut", "true");
    setTimeout(() => localStorage.removeItem("loggedOut"), 500);
    Cookies.remove("jwt");
    setUser(undefined);
    queryClient.clear();
    onClose();
    navigate("/login");
  };

  const handleLogoutClick = () => {
    if (hasActiveSession) {
      setIsLogoutModalOpen(true);
    } else {
      logout();
    }
  };

  return {
    user,
    routes,
    pages,
    currentRoute,
    openGroups,
    setOpenGroups,
    toggleGroup,
    getActiveTab,
    getAllowedTabs,
    getFilteredChildren,
    handleRouteNavigation,
    menuOptions,
    handleMenuSelect,
    searchValue,
    setSearchValue,
    hasActiveSession,
    logout,
    handleLogoutClick,
  };
}
