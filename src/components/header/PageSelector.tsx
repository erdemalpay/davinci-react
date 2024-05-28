import { Bars3Icon } from "@heroicons/react/24/outline";
import {
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
} from "@material-tailwind/react";
import Cookies from "js-cookie";
import { useTranslation } from "react-i18next";
import { IoIosLogOut } from "react-icons/io";
import { useLocation, useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { allRoutes } from "../../navigation/constants";
import { Role, RolePermissionEnum } from "../../types";

export function PageSelector() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const currentRoute = location.pathname;
  const { user, setUser } = useUserContext();
  const { setCurrentPage, setRowsPerPage, setExpandedRows, setSearchQuery } =
    useGeneralContext();
  const routes = Object.values(RolePermissionEnum)
    .filter((permission) => user?.role.permissions.includes(permission))
    .map((permission) => {
      const exceptionRoutes = Object.values(RolePermissionEnum).reduce<
        {
          name: string;
          path: string;
          isOnSidebar: boolean;
          exceptionRoleIds?: number[];
          element: () => JSX.Element;
        }[]
      >((acc, permission) => {
        const routesWithExceptions = allRoutes[permission]
          .filter(
            (route) =>
              route.exceptionRoleIds &&
              route.exceptionRoleIds.includes((user?.role as Role)._id)
          )
          .map((route) => ({ ...route, permission }));

        return acc.concat(routesWithExceptions);
      }, []);
      const disabledRoutes = Object.values(RolePermissionEnum).reduce<
        {
          name: string;
          path: string;
          isOnSidebar: boolean;
          exceptionRoleIds?: number[];
          element: () => JSX.Element;
        }[]
      >((acc, permission) => {
        const disabledRoutes = allRoutes[permission]
          .filter(
            (route) =>
              route.disabledRoleIds &&
              route.disabledRoleIds.includes((user?.role as Role)._id)
          )
          .map((route) => ({ ...route, permission }));

        return acc.concat(disabledRoutes);
      }, []);
      const enabledRoutes = [...allRoutes[permission], ...exceptionRoutes];
      const routes = enabledRoutes.filter(
        (route) =>
          !disabledRoutes.some(
            (disabledRoute) => disabledRoute.path === route.path
          )
      );
      return routes;
    })
    .flat();

  function logout() {
    localStorage.clear();
    localStorage.setItem("loggedOut", "true");
    setTimeout(() => localStorage.removeItem("loggedOut"), 500);
    Cookies.remove("jwt");
    setUser(undefined);
    navigate("/login");
  }

  return (
    <Menu>
      <MenuHandler>
        <button className="text-sm text-white">
          <Bars3Icon className="h-5 w-5" />
        </button>
      </MenuHandler>
      <MenuList>
        {routes.map((route) => {
          if (!route.isOnSidebar) return <div key={route.name}></div>;
          return (
            <MenuItem
              className={`${
                route.path === currentRoute ? "bg-gray-100  text-black" : ""
              }  `}
              key={route.name}
              onClick={() => {
                if (currentRoute === route.path) return;
                setCurrentPage(1);
                // setRowsPerPage(RowPerPageEnum.FIRST);
                setExpandedRows({});
                setSearchQuery("");
                navigate(route.path);
              }}
            >
              {t(route.name)}
            </MenuItem>
          );
        })}
        <MenuItem className="flex flex-row gap-2 items-center" onClick={logout}>
          <IoIosLogOut className="text-lg" />
          {t("Logout")}
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
