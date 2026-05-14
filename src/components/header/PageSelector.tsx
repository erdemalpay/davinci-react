import { Bars3Icon } from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Cookies from "js-cookie";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { IoIosLogOut } from "react-icons/io";
import { useLocation, useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { useFilteredRoutes } from "../../hooks/useFilteredRoutes";
import { Role } from "../../types";
import { useGetBreaksByDate } from "../../utils/api/break";
import { useGetGameplayTimesByDate } from "../../utils/api/gameplaytime";
import { useGetPanelControlPages } from "../../utils/api/panelControl/page";
import { useGetUser } from "../../utils/api/user";
import { clearLocalStoragePreservingOnboarding } from "../../utils/onboardingStorage";
import { getTabSlug } from "../../utils/slug";
import { usernamify } from "../../utils/string";
import AutocompleteInput from "../panelComponents/FormElements/AutocompleteInput";
import { Tab } from "../panelComponents/shared/types";

type SidebarRouteItem = {
  name: string;
  path?: string;
  link?: string;
  isOnSidebar?: boolean;
  exceptionalRoles?: number[];
  tabs?: Tab[];
  children?: SidebarRouteItem[];
};

export function PageSelector() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const queryClient = useQueryClient();
  const currentRoute = location.pathname;
  const { setUser } = useUserContext();
  const user = useGetUser();
  const { resetGeneralContext, setIsNotificationOpen, setIsLogoutModalOpen } =
    useGeneralContext();
  const [openGroups, setOpenGroups] = useState<{ [group: string]: boolean }>(
    {}
  );

  const routes = useFilteredRoutes();
  const pages = useGetPanelControlPages();
  const [searchValue, setSearchValue] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [headerBottom, setHeaderBottom] = useState(64);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Active session checks
  const todayDate = format(new Date(), "yyyy-MM-dd");
  const activeBreaks = useGetBreaksByDate(todayDate);
  const activeGameplayTimes = useGetGameplayTimesByDate(todayDate);

  const userActiveBreak = activeBreaks?.find(
    (breakRecord) =>
      (typeof breakRecord.user === "string"
        ? breakRecord.user
        : breakRecord.user._id) === user?._id && !breakRecord.finishHour
  );

  const userActiveGameplayTime = activeGameplayTimes?.find(
    (gameplayTime) =>
      (typeof gameplayTime.user === "string"
        ? gameplayTime.user
        : gameplayTime.user._id) === user?._id && !gameplayTime.finishHour
  );

  const hasActiveSession = userActiveBreak || userActiveGameplayTime;

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const getActiveTab = () => {
    return new URLSearchParams(location.search).get("tab");
  };

  const renderTabs = (item: SidebarRouteItem) => {
    if (!item.tabs || item.tabs.length === 0 || !item.path) {
      return null;
    }

    const pageId = usernamify(item.name);
    const controlPage = pages?.find((p) => p._id === pageId);
    const controlTabs =
      (controlPage?.tabs as { name: string; permissionRoles?: number[] }[]) ??
      [];

    const allowedTabs = (item.tabs ?? []).filter(
      (ct) =>
        !!controlTabs.find(
          (pt) =>
            pt.name === ct.label &&
            pt.permissionRoles?.includes((user?.role as Role)?._id)
        )
    );

    if (allowedTabs.length === 0) return null;

    const activeTab = getActiveTab();

    return (
      <div className="mt-1 space-y-1 bg-gray-50">
        {allowedTabs.map((tab) => {
          const tabSlug = getTabSlug(tab.label);
          const isActive = item.path === currentRoute && activeTab === tabSlug;

          return (
            <button
              key={tab.label}
              onClick={() => {
                resetGeneralContext();
                navigate(`${item.path}?tab=${tabSlug}`);
                window.scrollTo(0, 0);
                setIsMenuOpen(false);
              }}
              className={`
                w-full flex justify-start text-left pl-12 pr-4 py-2 rounded-none
                text-sm font-normal transition-colors
                ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }
              `}
            >
              {t(tab.label)}
            </button>
          );
        })}
      </div>
    );
  };

  // Build menu options for autocomplete
  const menuOptionsList: Array<{
    label: string;
    path: string;
    link?: string;
    tabSlug?: string;
  }> = [];

  routes.forEach((route) => {
    const filteredRouteChildren = route?.children?.filter(
      (child) =>
        child?.exceptionalRoles?.includes((user?.role as Role)?._id) ||
        pages?.some(
          (page) =>
            page.name === child.name &&
            page.permissionRoles?.includes((user?.role as Role)?._id)
        )
    );

    if (filteredRouteChildren && filteredRouteChildren?.length > 1) {
      filteredRouteChildren.forEach((child) => {
        if (!child.isOnSidebar) return;

        // add child main option
        menuOptionsList.push({
          label: t(child.name),
          path: child.path || "",
          link: child.link,
        });

        // add allowed child tabs
        const controlTabsForChild =
          (pages?.find((p) => p._id === usernamify(child.name))?.tabs as {
            name: string;
            permissionRoles?: number[];
          }[]) ?? [];
        const allowedChildTabs = (child.tabs ?? []).filter(
          (ct) =>
            !!controlTabsForChild.find(
              (pt) =>
                pt.name === ct.label &&
                pt.permissionRoles?.includes((user?.role as Role)?._id)
            )
        );

        allowedChildTabs.forEach((tab) => {
          menuOptionsList.push({
            label: `${t(child.name)} / ${t(tab.label)}`,
            path: child.path || "",
            tabSlug: getTabSlug(tab.label),
          });
        });
      });
    } else if (filteredRouteChildren && filteredRouteChildren?.length === 1) {
      const child = filteredRouteChildren[0];
      if (child.isOnSidebar) {
        menuOptionsList.push({
          label: t(child.name),
          path: child.path || "",
          link: child.link,
        });

        const controlTabsForChild =
          (pages?.find((p) => p._id === usernamify(child.name))?.tabs as {
            name: string;
            permissionRoles?: number[];
          }[]) ?? [];
        const allowedChildTabs = (child.tabs ?? []).filter(
          (ct) =>
            !!controlTabsForChild.find(
              (pt) =>
                pt.name === ct.label &&
                pt.permissionRoles?.includes((user?.role as Role)?._id)
            )
        );

        allowedChildTabs.forEach((tab) => {
          menuOptionsList.push({
            label: `${t(child.name)} / ${t(tab.label)}`,
            path: child.path || "",
            tabSlug: getTabSlug(tab.label),
          });
        });
      }
    } else if (route.isOnSidebar) {
      menuOptionsList.push({
        label: t(route.name),
        path: route.path || "",
        link: route.link,
      });

      // add allowed route-level tabs
      const controlTabsForRoute =
        (pages?.find((p) => p._id === usernamify(route.name))?.tabs as {
          name: string;
          permissionRoles?: number[];
        }[]) ?? [];
      const allowedRouteTabs = (route.tabs ?? []).filter(
        (ct) =>
          !!controlTabsForRoute.find(
            (pt) =>
              pt.name === ct.label &&
              pt.permissionRoles?.includes((user?.role as Role)?._id)
          )
      );

      allowedRouteTabs.forEach((tab) => {
        menuOptionsList.push({
          label: `${t(route.name)} / ${t(tab.label)}`,
          path: route.path || "",
          tabSlug: getTabSlug(tab.label),
        });
      });
    }
  });

  const seenLabels = new Set<string>();
  const menuOptions = menuOptionsList
    .filter((item) => {
      if (seenLabels.has(item.label)) return false;
      seenLabels.add(item.label);
      return true;
    })
    .map((item) => ({
      value: item.label,
      label: item.label,
    }));

  const handleMenuSelect = (value: string) => {
    const selectedOption = menuOptionsList.find((opt) => opt.label === value);

    if (selectedOption) {
      if (selectedOption.link) {
        window.location.href = selectedOption.link;
      } else if (selectedOption.path) {
        resetGeneralContext();

        if (selectedOption.tabSlug) {
          navigate(`${selectedOption.path}?tab=${selectedOption.tabSlug}`);
        } else {
          navigate(selectedOption.path);
        }

        window.scrollTo(0, 0);
        setIsMenuOpen(false);
      }
    }

    setSearchValue(value);
  };

  function logout() {
    clearLocalStoragePreservingOnboarding();
    localStorage.setItem("loggedOut", "true");
    setTimeout(() => localStorage.removeItem("loggedOut"), 500);
    Cookies.remove("jwt");
    setUser(undefined);
    queryClient.clear();
    navigate("/login");
  }

  const handleLogoutClick = () => {
    // If user has active break or gameplay session, show warning modal
    if (hasActiveSession) {
      setIsLogoutModalOpen(true);
    } else {
      // No active session, logout directly
      logout();
    }
  };
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        className="text-sm text-white"
        onClick={() => {
          setIsNotificationOpen(false);
          if (!isMenuOpen && buttonRef.current) {
            const nav = buttonRef.current.closest("nav");
            if (nav) setHeaderBottom(nav.getBoundingClientRect().bottom);
          }
          setIsMenuOpen((prev) => !prev);
        }}
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ease-in-out ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          setIsMenuOpen(false);
        }}
      />
      <div
        ref={menuRef}
        className={`fixed right-0 bottom-0 w-3/5 md:w-1/3 bg-gray-100 text-gray-800 z-50 overflow-y-auto overflow-x-hidden no-scrollbar transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          top: headerBottom,
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
        }}
      >
          <div className="px-3 py-2">
            <AutocompleteInput
              placeholder={t("Search menu...") || "Search menu..."}
              value={searchValue}
              options={menuOptions}
              onChange={handleMenuSelect}
              onClear={() => setSearchValue("")}
              disabled={false}
              isOnClearActive={true}
              className="px-3 py-2 border border-gray-300 rounded-md text-base"
              minCharacters={1}
            />
          </div>
          {routes.map((route) => {
            const filteredRouteChildren = route?.children?.filter(
              (child) =>
                child?.exceptionalRoles?.includes((user?.role as Role)?._id) ||
                pages?.some(
                  (page) =>
                    page.name === child.name &&
                    page.permissionRoles?.includes((user?.role as Role)?._id)
                )
            );

            if (filteredRouteChildren && filteredRouteChildren?.length > 1) {
              return (
                <div key={route.name}>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 group flex items-center justify-between cursor-pointer hover:bg-gray-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroup(route.name);
                    }}
                  >
                    <span>{t(route.name)}</span>
                    {openGroups[route.name] ? (
                      <FiChevronDown className="text-lg" />
                    ) : (
                      <FiChevronRight className="text-lg" />
                    )}
                  </button>

                  {openGroups[route.name] &&
                    filteredRouteChildren
                      .filter((child) => child.isOnSidebar)
                      .map((child) => {
                        const controlTabsForChild =
                          (pages?.find((p) => p._id === usernamify(child.name))
                            ?.tabs as {
                            name: string;
                            permissionRoles?: number[];
                          }[]) ?? [];
                        const allowedChildTabs = (child.tabs ?? []).filter(
                          (ct) =>
                            !!controlTabsForChild.find(
                              (pt) =>
                                pt.name === ct.label &&
                                pt.permissionRoles?.includes(
                                  (user?.role as Role)?._id
                                )
                            )
                        );
                        const childHasTabs = allowedChildTabs.length > 0;
                        const childKey = `${route.name}-${child.name}`;
                        const isChildOpen = openGroups[childKey];

                        return (
                          <div key={child.name}>
                            <div className="flex items-center">
                              <button
                                className={`
                                  flex-1 flex items-center pl-8 pr-3 py-2 rounded-none
                                  text-sm font-normal transition-colors
                                  ${
                                    child.path === currentRoute
                                      ? "bg-blue-50 text-blue-600 font-medium"
                                      : "text-gray-600 hover:bg-gray-50"
                                  }
                                  ${
                                    child.link
                                      ? "text-blue-600 hover:text-blue-700"
                                      : ""
                                  }
                                `}
                                onClick={() => {
                                  if (child.link) {
                                    window.location.href = child.link;
                                    return;
                                  }

                                  if (!child.path) return;

                                  resetGeneralContext();

                                  const pageId = usernamify(child.name);
                                  const controlPage = pages?.find(
                                    (p) => p._id === pageId
                                  );
                                  const controlTabs =
                                    (controlPage?.tabs as {
                                      name: string;
                                      permissionRoles?: number[];
                                    }[]) ?? [];
                                  const allowedTabs = (child.tabs ?? []).filter(
                                    (ct) =>
                                      !!controlTabs.find(
                                        (pt) =>
                                          pt.name === ct.label &&
                                          pt.permissionRoles?.includes(
                                            (user?.role as Role)?._id
                                          )
                                      )
                                  );

                                  if (allowedTabs.length > 0) {
                                    navigate(
                                      `${child.path}?tab=${getTabSlug(
                                        allowedTabs[0].label
                                      )}`
                                    );
                                  } else {
                                    navigate(child.path);
                                  }

                                  window.scrollTo(0, 0);
                                  setIsMenuOpen(false);
                                }}
                              >
                                {t(child.name)}
                              </button>

                              {childHasTabs && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleGroup(childKey);
                                  }}
                                  className="p-2 text-gray-500 hover:bg-gray-100"
                                  aria-label={`Toggle ${child.name} tabs`}
                                >
                                  {isChildOpen ? (
                                    <FiChevronDown className="text-sm" />
                                  ) : (
                                    <FiChevronRight className="text-sm" />
                                  )}
                                </button>
                              )}
                            </div>

                            {isChildOpen && renderTabs(child)}
                          </div>
                        );
                      })}
                </div>
              );
            } else if (
              filteredRouteChildren &&
              filteredRouteChildren?.length === 1
            ) {
              const child = filteredRouteChildren[0];

              if (!child.isOnSidebar) return null;

              const controlTabsForChild =
                (pages?.find((p) => p._id === usernamify(child.name))?.tabs as {
                  name: string;
                  permissionRoles?: number[];
                }[]) ?? [];
              const allowedChildTabs = (child.tabs ?? []).filter(
                (ct) =>
                  !!controlTabsForChild.find(
                    (pt) =>
                      pt.name === ct.label &&
                      pt.permissionRoles?.includes((user?.role as Role)?._id)
                  )
              );
              const childHasTabs = allowedChildTabs.length > 0;
              const childKey = `${route.name}-${child.name}`;
              const isChildOpen = openGroups[childKey];

              return (
                <div key={child.name}>
                  <div className="flex items-center">
                    <button
                      className={`
                        flex-1 flex items-center pl-4 pr-3 py-2 rounded-none
                        text-sm font-normal transition-colors
                        ${
                          child.path === currentRoute
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "text-gray-600 hover:bg-gray-50"
                        }
                        ${child.link ? "text-blue-600 hover:text-blue-700" : ""}
                      `}
                      onClick={() => {
                        if (child.link) {
                          window.location.href = child.link;
                          return;
                        }

                        if (!child.path) return;

                        resetGeneralContext();

                        const pageId = usernamify(child.name);
                        const controlPage = pages?.find(
                          (p) => p._id === pageId
                        );
                        const controlTabs =
                          (controlPage?.tabs as {
                            name: string;
                            permissionRoles?: number[];
                          }[]) ?? [];
                        const allowedTabs = (child.tabs ?? []).filter(
                          (ct) =>
                            !!controlTabs.find(
                              (pt) =>
                                pt.name === ct.label &&
                                pt.permissionRoles?.includes(
                                  (user?.role as Role)?._id
                                )
                            )
                        );

                        if (allowedTabs.length > 0) {
                          navigate(
                            `${child.path}?tab=${getTabSlug(
                              allowedTabs[0].label
                            )}`
                          );
                        } else {
                          navigate(child.path);
                        }

                        window.scrollTo(0, 0);
                        setIsMenuOpen(false);
                      }}
                    >
                      {t(child.name)}
                    </button>

                    {childHasTabs && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroup(childKey);
                        }}
                        className="p-2 text-gray-500 hover:bg-gray-100"
                        aria-label={`Toggle ${child.name} tabs`}
                      >
                        {isChildOpen ? (
                          <FiChevronDown className="text-sm" />
                        ) : (
                          <FiChevronRight className="text-sm" />
                        )}
                      </button>
                    )}
                  </div>

                  {isChildOpen && renderTabs(child)}
                </div>
              );
            } else {
              if (!route.isOnSidebar) return null;

              const controlTabsForRoute =
                (pages?.find((p) => p._id === usernamify(route.name))?.tabs as {
                  name: string;
                  permissionRoles?: number[];
                }[]) ?? [];
              const allowedRouteTabs = (route.tabs ?? []).filter(
                (ct) =>
                  !!controlTabsForRoute.find(
                    (pt) =>
                      pt.name === ct.label &&
                      pt.permissionRoles?.includes((user?.role as Role)?._id)
                  )
              );
              const routeHasTabs = allowedRouteTabs.length > 0;
              const isRouteOpen = openGroups[route.name];

              return (
                <div key={route.name}>
                  <div className="flex items-center">
                    <button
                      className={`
                        flex-1 flex items-center px-4 py-2 rounded-none
                        text-md font-normal transition-colors
                        ${
                          route.path === currentRoute
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "text-gray-600 hover:bg-gray-50"
                        }
                        ${route.link ? "text-blue-600 hover:text-blue-700" : ""}
                      `}
                      onClick={() => {
                        if (route.link) {
                          window.location.href = route.link;
                          return;
                        }

                        if (!route.path) return;

                        resetGeneralContext();

                        const pageId = usernamify(route.name);
                        const controlPage = pages?.find(
                          (p) => p._id === pageId
                        );
                        const controlTabs =
                          (controlPage?.tabs as {
                            name: string;
                            permissionRoles?: number[];
                          }[]) ?? [];
                        const allowedTabs = (route.tabs ?? []).filter(
                          (ct) =>
                            !!controlTabs.find(
                              (pt) =>
                                pt.name === ct.label &&
                                pt.permissionRoles?.includes(
                                  (user?.role as Role)?._id
                                )
                            )
                        );

                        if (allowedTabs.length > 0) {
                          navigate(
                            `${route.path}?tab=${getTabSlug(
                              allowedTabs[0].label
                            )}`
                          );
                        } else {
                          navigate(route.path);
                        }

                        window.scrollTo(0, 0);
                        setIsMenuOpen(false);
                      }}
                    >
                      {t(route.name)}
                    </button>

                    {routeHasTabs && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroup(route.name);
                        }}
                        className="p-2 text-gray-500 hover:bg-gray-100"
                        aria-label={`Toggle ${route.name} tabs`}
                      >
                        {isRouteOpen ? (
                          <FiChevronDown className="text-sm" />
                        ) : (
                          <FiChevronRight className="text-sm" />
                        )}
                      </button>
                    )}
                  </div>

                  {isRouteOpen && renderTabs(route)}
                </div>
              );
            }
          })}

          <button
            type="button"
            className="w-full text-left flex flex-row gap-2 items-center px-4 py-2 hover:bg-gray-100"
            onClick={handleLogoutClick}
          >
            <IoIosLogOut className="text-lg" />
            {t("Logout")}
          </button>
      </div>
    </div>
  );
}
