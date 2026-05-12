import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Cookies from "js-cookie";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiChevronDown, FiChevronLeft, FiChevronRight } from "react-icons/fi";
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
import { getMenuIcon } from "../../utils/menuIcons";
import { clearLocalStoragePreservingOnboarding } from "../../utils/onboardingStorage";
import AutocompleteInput from "../panelComponents/FormElements/AutocompleteInput";
import SidebarTooltip from "./SidebarTooltip";

export const Sidebar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    resetGeneralContext,
    setIsLogoutModalOpen,
    isHoverExpanded,
    setIsHoverExpanded,
  } = useGeneralContext();
  const { setUser, user: contextUser } = useUserContext();
  const user = useGetUser(!!contextUser);
  const currentRoute = location.pathname;
  const [openGroups, setOpenGroups] = useState<{ [group: string]: boolean }>(
    {}
  );
  const [searchValue, setSearchValue] = useState("");

  const isExpanded = isSidebarOpen || isHoverExpanded;
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (isSidebarOpen) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHoverExpanded(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHoverExpanded(false);
  };

  const routes = useFilteredRoutes();
  const pages = useGetPanelControlPages(!!contextUser);

  const todayDate = format(new Date(), "yyyy-MM-dd");
  const activeBreaks = useGetBreaksByDate(todayDate, !!contextUser);
  const activeGameplayTimes = useGetGameplayTimesByDate(
    todayDate,
    !!contextUser
  );

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

  useEffect(() => {
    if (!isSidebarOpen) {
      setOpenGroups({});
    }
  }, [isSidebarOpen]);

  if (!user || routes.length === 0) {
    return null;
  }

  // Build menu options for autocomplete
  const menuOptionsList: Array<{
    label: string;
    path: string;
    link?: string;
  }> = [];

  routes.forEach((route) => {
    const filteredRouteChildren = route?.children?.filter(
      (child) =>
        child?.exceptionalRoles?.includes((user?.role as Role)._id) ||
        pages?.some(
          (page) =>
            page.name === child.name &&
            page.permissionRoles?.includes((user?.role as Role)._id)
        )
    );

    if (filteredRouteChildren && filteredRouteChildren?.length > 1) {
      filteredRouteChildren.forEach((child) => {
        if (child.isOnSidebar) {
          menuOptionsList.push({
            label: t(child.name),
            path: child.path || "",
            link: child.link,
          });
        }
      });
    } else if (filteredRouteChildren && filteredRouteChildren?.length === 1) {
      if (filteredRouteChildren[0].isOnSidebar) {
        menuOptionsList.push({
          label: t(filteredRouteChildren[0].name),
          path: filteredRouteChildren[0].path || "",
          link: filteredRouteChildren[0].link,
        });
      }
    } else if (route.isOnSidebar) {
      menuOptionsList.push({
        label: t(route.name),
        path: route.path || "",
        link: route.link,
      });
    }
  });

  const menuOptions = menuOptionsList.map((item) => ({
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
        navigate(selectedOption.path);
        window.scrollTo(0, 0);
        setIsSidebarOpen(false);
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
    setIsSidebarOpen(false);
    queryClient.clear();
    navigate("/login");
  };

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
    <>
      {isSidebarOpen && (
        <div
          className="hidden lg:block fixed inset-0 bg-black/20 transition-opacity duration-300 z-40"
          onClick={() => {
            setIsSidebarOpen(false);
            setIsHoverExpanded(false);
          }}
        />
      )}
      <aside
        className={`
          hidden lg:block fixed top-0 left-0 h-screen border-r border-gray-200
          transition-all duration-300 ease-in-out shadow-lg z-50
          ${isExpanded ? "w-64" : "w-16"}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={`h-16 bg-gray-800 flex items-center border-b border-gray-700 transition-all duration-200 ${
            isExpanded ? "justify-end pr-4" : "justify-center"
          }`}
        >
          <button
            onClick={() => {
              if (isHoverExpanded && !isSidebarOpen) {
                setIsHoverExpanded(false);
              } else {
                const next = !isSidebarOpen;
                setIsSidebarOpen(next);
                if (!next) setIsHoverExpanded(false);
              }
            }}
            className="flex items-center justify-center w-10 h-10 rounded-lg 
              text-white hover:bg-gray-700 transition-all duration-200"
            aria-label="Toggle Sidebar"
          >
            {isExpanded ? (
              <FiChevronLeft className="text-2xl" />
            ) : (
              <FiChevronRight className="text-2xl" />
            )}
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-4rem)] py-3 px-2 bg-white overflow-y-auto">
          <div className="mb-4">
            <AutocompleteInput
              placeholder={t("Search menu...") || "Search menu..."}
              value={searchValue}
              options={menuOptions}
              onChange={handleMenuSelect}
              onClear={() => setSearchValue("")}
              disabled={false}
              isOnClearActive={true}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              minCharacters={1}
            />
          </div>
          <div className="flex-1 space-y-1">
            {routes.map((route) => {
              const filteredRouteChildren = route?.children?.filter(
                (child) =>
                  child?.exceptionalRoles?.includes((user?.role as Role)._id) ||
                  pages?.some(
                    (page) =>
                      page.name === child.name &&
                      page.permissionRoles?.includes((user?.role as Role)._id)
                  )
              );

              if (filteredRouteChildren && filteredRouteChildren?.length > 1) {
                const IconComponent = getMenuIcon(route.name);
                return (
                  <div key={route.name}>
                    <SidebarTooltip content={t(route.name)}>
                      <button
                        onClick={() => {
                          if (!isSidebarOpen) {
                            setIsSidebarOpen(true);
                            setTimeout(() => {
                              toggleGroup(route.name);
                            }, 100);
                          } else {
                            toggleGroup(route.name);
                          }
                        }}
                        className="w-full flex items-center justify-between px-2 py-2 rounded-lg
                        text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center justify-center text-gray-700 flex-shrink-0">
                            <IconComponent className="text-xl" />
                          </div>
                          {isExpanded && <span>{t(route.name)}</span>}
                        </div>
                        {isExpanded &&
                          (openGroups[route.name] ? (
                            <FiChevronDown className="text-sm" />
                          ) : (
                            <FiChevronRight className="text-sm" />
                          ))}
                      </button>
                    </SidebarTooltip>

                    {isExpanded &&
                      openGroups[route.name] &&
                      filteredRouteChildren
                        .filter((child) => child.isOnSidebar)
                        .map((child) => (
                          <button
                            key={child.name}
                            className={`
                            w-full flex items-center pl-8 pr-3 py-2 rounded-lg mt-1
                            text-sm transition-colors
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
                              if (child.path) {
                                resetGeneralContext();
                                navigate(child.path);
                                window.scrollTo(0, 0);
                                setIsSidebarOpen(false);
                              }
                            }}
                          >
                            {t(child.name)}
                          </button>
                        ))}
                  </div>
                );
              }

              if (
                filteredRouteChildren &&
                filteredRouteChildren?.length === 1
              ) {
                if (!filteredRouteChildren[0].isOnSidebar) return null;
                const IconComponent = getMenuIcon(
                  filteredRouteChildren[0].name
                );
                return (
                  <SidebarTooltip
                    key={filteredRouteChildren[0].name}
                    content={t(filteredRouteChildren[0].name)}
                  >
                    <button
                      className={`
                      w-full flex items-center gap-2.5 px-2 py-2 rounded-lg
                      text-sm transition-colors
                      ${
                        filteredRouteChildren[0].path === currentRoute
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                      ${
                        filteredRouteChildren[0].link
                          ? "text-blue-600 hover:text-blue-700"
                          : ""
                      }
                    `}
                      onClick={() => {
                        if (filteredRouteChildren[0].link) {
                          window.location.href = filteredRouteChildren[0].link;
                          return;
                        }
                        if (filteredRouteChildren[0].path) {
                          resetGeneralContext();
                          navigate(filteredRouteChildren[0].path);
                          window.scrollTo(0, 0);
                        }
                      }}
                    >
                      <div
                        className={`flex items-center justify-center flex-shrink-0 ${
                          filteredRouteChildren[0].path === currentRoute
                            ? "text-blue-600"
                            : "text-gray-700"
                        }`}
                      >
                        <IconComponent className="text-xl" />
                      </div>
                      {isExpanded && (
                        <span>{t(filteredRouteChildren[0].name)}</span>
                      )}
                    </button>
                  </SidebarTooltip>
                );
              }

              if (!route.isOnSidebar) return null;
              const IconComponent = getMenuIcon(route.name);
              return (
                <SidebarTooltip key={route.name} content={t(route.name)}>
                  <button
                    className={`
                    w-full flex items-center gap-2.5 px-2 py-2 rounded-lg
                    text-sm transition-colors
                    ${
                      route.path === currentRoute
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                    ${route.link ? "text-blue-600 hover:text-blue-700" : ""}
                  `}
                    onClick={() => {
                      if (route.link) {
                        window.location.href = route.link;
                        return;
                      }
                      if (route.path) {
                        resetGeneralContext();
                        navigate(route.path);
                        window.scrollTo(0, 0);
                      }
                    }}
                  >
                    <div
                      className={`flex items-center justify-center flex-shrink-0 ${
                        route.path === currentRoute
                          ? "text-blue-600"
                          : "text-gray-700"
                      }`}
                    >
                      <IconComponent className="text-xl" />
                    </div>
                    {isExpanded && <span>{t(route.name)}</span>}
                  </button>
                </SidebarTooltip>
              );
            })}
          </div>

          <div className="border-t border-gray-200 pt-3 mt-3">
            <SidebarTooltip content={t("Logout")}>
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg
                text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center justify-center text-red-600 flex-shrink-0">
                  <IoIosLogOut className="text-xl" />
                </div>
                {isExpanded && <span>{t("Logout")}</span>}
              </button>
            </SidebarTooltip>
          </div>
        </div>
      </aside>
    </>
  );
};
