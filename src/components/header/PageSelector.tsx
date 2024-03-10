import { Bars3Icon } from "@heroicons/react/24/outline";
import {
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
} from "@material-tailwind/react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { allRoutes } from "../../navigation/constants";
import { RolePermissionEnum, RowPerPageEnum } from "../../types";

export function PageSelector() {
  const navigate = useNavigate();
  const { user, setUser } = useUserContext();
  const { setCurrentPage, setRowsPerPage } = useGeneralContext();
  const routes = Object.values(RolePermissionEnum)
    .filter((permission) => user?.role.permissions.includes(permission))
    .map((permission) => allRoutes[permission])
    .flat();

  function logout() {
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
              key={route.name}
              onClick={() => {
                setCurrentPage(1);
                setRowsPerPage(RowPerPageEnum.FIRST);
                navigate(route.path);
              }}
            >
              {route.name}
            </MenuItem>
          );
        })}
        <MenuItem onClick={logout}>Logout</MenuItem>
      </MenuList>
    </Menu>
  );
}
