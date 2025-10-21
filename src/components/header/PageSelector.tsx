import { Bars3Icon } from "@heroicons/react/24/outline";
import {
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
} from "@material-tailwind/react";
import { useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { IoIosLogOut } from "react-icons/io";
import { useLocation, useNavigate } from "react-router-dom";
import user1 from "../../components/panelComponents/assets/profile/user-1.jpg";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { useFilteredRoutes } from "../../hooks/useFilteredRoutes";
import { Routes } from "../../navigation/constants";
import { Role } from "../../types";
import { useGetPanelControlPages } from "../../utils/api/panelControl/page";
import { useGetUser } from "../../utils/api/user";

export function PageSelector() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const queryClient = useQueryClient();
  const currentRoute = location.pathname;
  const { setUser } = useUserContext();
  const user = useGetUser(); // Bu hook profil güncellendiğinde otomatik yeni data çeker
  const { resetGeneralContext, setIsNotificationOpen } = useGeneralContext();
  const [openGroups, setOpenGroups] = useState<{ [group: string]: boolean }>(
    {}
  );

  const routes = useFilteredRoutes();

  const pages = useGetPanelControlPages();

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  function logout() {
    localStorage.clear();
    localStorage.setItem("loggedOut", "true");
    setTimeout(() => localStorage.removeItem("loggedOut"), 500);
    Cookies.remove("jwt");
    setUser(undefined);
    queryClient.clear();
    navigate("/login");
  }
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
        <div className="mb-3 pb-3 border-b border-gray-200">
          <MenuItem
            onClick={() => {
              navigate(Routes.Profile);
              window.scrollTo(0, 0);
            }}
            className="flex items-center gap-3 p-3 hover:bg-gray-50"
          >
            <img
              src={user?.imageUrl ?? user1}
              alt="profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
            />
            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className="text-sm font-semibold text-gray-900 truncate w-full">
                {user?.name}
              </span>
              <span className="text-xs text-gray-500 truncate w-full">
                {(user?.role as Role)?.name}
              </span>
            </div>
          </MenuItem>
        </div>

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

        <MenuItem className="flex flex-row gap-2 items-center" onClick={logout}>
          <IoIosLogOut className="text-lg" />
          {t("Logout")}
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
