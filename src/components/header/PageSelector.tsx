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
import { IoIosLogOut } from "react-icons/io";
import { useLocation, useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { allRoutes } from "../../navigation/constants";
import { Role } from "../../types";
import { useGetPanelControlPages } from "../../utils/api/panelControl/page";

export function PageSelector() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const pages = useGetPanelControlPages();
  const queryClient = useQueryClient();
  const currentRoute = location.pathname;
  const { user, setUser } = useUserContext();
  const { resetGeneralContext, setIsNotificationOpen } = useGeneralContext();
  const [openGroups, setOpenGroups] = useState<{ [group: string]: boolean }>(
    {}
  );

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };
  const routes = allRoutes?.filter(
    (route) =>
      route?.exceptionalRoles?.includes((user?.role as Role)._id) ||
      pages?.some(
        (page) =>
          page.name === route.name &&
          page.permissionRoles?.includes((user?.role as Role)._id)
      )
  );
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
        {routes.map((route) => {
          if (route.children && route.children.length > 0) {
            return (
              <div key={route.name}>
                {/* Custom header element for grouped items */}
                <div
                  className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent the click from closing the menu
                    toggleGroup(route.name);
                  }}
                >
                  {t(route.name)}
                </div>
                {openGroups[route.name] &&
                  route.children.map((child) => (
                    <MenuItem
                      key={child.name}
                      className={`pl-8 ${
                        child.path === currentRoute
                          ? "bg-gray-100 text-black"
                          : ""
                      }`}
                      onClick={() => {
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
