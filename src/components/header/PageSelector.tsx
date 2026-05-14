import { Bars3Icon } from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { IoIosLogOut } from "react-icons/io";
import { useNavigate } from "react-router-dom";

import { useGeneralContext } from "../../context/General.context";
import { getTabSlug } from "../../utils/slug";
import AutocompleteInput from "../panelComponents/FormElements/AutocompleteInput";
import {
  useSidebarNavigation,
  type SidebarRouteItem,
} from "../../hooks/useSidebarNavigation";

export function PageSelector() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { resetGeneralContext, setIsNotificationOpen } = useGeneralContext();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [headerBottom, setHeaderBottom] = useState(64);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const {
    routes,
    currentRoute,
    openGroups,
    toggleGroup,
    getActiveTab,
    getAllowedTabs,
    getFilteredChildren,
    handleRouteNavigation,
    menuOptions,
    handleMenuSelect,
    searchValue,
    setSearchValue,
    handleLogoutClick,
  } = useSidebarNavigation(() => setIsMenuOpen(false));

  const renderTabs = (item: SidebarRouteItem) => {
    if (!item.path) return null;

    const allowedTabs = getAllowedTabs(item);
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
          const filteredRouteChildren = getFilteredChildren(route);

          if (filteredRouteChildren && filteredRouteChildren.length > 1) {
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
                      const childHasTabs = getAllowedTabs(child).length > 0;
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
                              onClick={() => handleRouteNavigation(child)}
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
          }

          if (filteredRouteChildren && filteredRouteChildren.length === 1) {
            const child = filteredRouteChildren[0];

            if (!child.isOnSidebar) return null;

            const childHasTabs = getAllowedTabs(child).length > 0;
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
                    onClick={() => handleRouteNavigation(child)}
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
          }

          if (!route.isOnSidebar) return null;

          const routeHasTabs = getAllowedTabs(route).length > 0;
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
                  onClick={() => handleRouteNavigation(route)}
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
