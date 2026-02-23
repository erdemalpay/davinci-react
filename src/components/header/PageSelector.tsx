import { Bars3Icon } from "@heroicons/react/24/outline";
import {
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
} from "@material-tailwind/react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Cookies from "js-cookie";
import { useState } from "react";
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
    <Menu>
      <MenuHandler>
        <button className="text-sm text-white">
          <Bars3Icon
            className="h-5 w-5"
            onClick={() => {
              setIsNotificationOpen(false);
            }}
          />
        </button>
      </MenuHandler>
      <MenuList className="overflow-scroll no-scrollbar h-[95%] max-h-max">
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
                <MenuItem
                  className="group flex items-center justify-between cursor-pointer hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGroup(route.name);
                  }}
                >
                  <span>{t(route.name)}</span>
                  {openGroups[route.name] ? (
                    <FiChevronDown className="text-lg" />
                  ) : (
                    <FiChevronRight className="text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  )}
                </MenuItem>

                {openGroups[route.name] &&
                  filteredRouteChildren
                    .filter((child) => child.isOnSidebar)
                    .map((child) => (
                      <MenuItem
                        key={child.name}
                        className={`pl-6 ${
                          child.path === currentRoute
                            ? "bg-gray-100 text-black"
                            : ""
                        }
                        ${
                          child.link &&
                          "text-blue-700 w-fit cursor-pointer hover:text-blue-500 transition-transform"
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
                          }
                        }}
                      >
                        {t(child.name)}
                      </MenuItem>
                    ))}
              </div>
            );
          } else if (
            filteredRouteChildren &&
            filteredRouteChildren?.length === 1
          ) {
            if (!filteredRouteChildren[0].isOnSidebar) return null;
            return (
              <MenuItem
                key={filteredRouteChildren[0].name}
                className={`${
                  filteredRouteChildren[0].path === currentRoute
                    ? "bg-gray-100 text-black"
                    : ""
                } ${
                  filteredRouteChildren[0].link &&
                  "text-blue-700 w-fit cursor-pointer hover:text-blue-500 transition-transform"
                }`}
                onClick={() => {
                  if (filteredRouteChildren && filteredRouteChildren[0].path) {
                    resetGeneralContext();
                    navigate(filteredRouteChildren[0].path);
                    window.scrollTo(0, 0);
                  }
                  if (filteredRouteChildren && filteredRouteChildren[0].link) {
                    window.location.href = filteredRouteChildren[0].link;
                    return;
                  }
                }}
              >
                {t(filteredRouteChildren[0].name)}
              </MenuItem>
            );
          } else {
            if (!route.isOnSidebar) return null;
            return (
              <MenuItem
                key={route.name}
                className={`${
                  route.path === currentRoute ? "bg-gray-100 text-black" : ""
                } ${
                  route.link &&
                  "text-blue-700 w-fit cursor-pointer hover:text-blue-500 transition-transform"
                }`}
                onClick={() => {
                  if (currentRoute === route.path) return;
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
                {t(route.name)}
              </MenuItem>
            );
          }
        })}

        <MenuItem
          className="flex flex-row gap-2 items-center"
          onClick={handleLogoutClick}
        >
          <IoIosLogOut className="text-lg" />
          {t("Logout")}
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
