import { Bars3Icon } from "@heroicons/react/24/outline";
import {
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
} from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { BaseRoutes } from "../../navigation/routes";

export function PageSelector() {
  const navigate = useNavigate();

  const routes = [
    {
      name: "Tables",
      path: BaseRoutes.Tables,
    },
    {
      name: "Reservations",
      path: BaseRoutes.Reservations,
    },
    {
      name: "Gameplays",
      path: BaseRoutes.Gameplays,
    },
    {
      name: "Games",
      path: BaseRoutes.Games,
    },
    {
      name: "Memberships",
      path: BaseRoutes.Memberships,
    },
    {
      name: "Rewards",
      path: BaseRoutes.Rewards,
    },
    {
      name: "Users",
      path: BaseRoutes.Users,
    },
    {
      name: "Visits",
      path: BaseRoutes.Visits,
    },
    {
      name: "Menu",
      path: BaseRoutes.Menu,
    },
    {
      name: "Analytics",
      path: BaseRoutes.Analytics,
    },
  ];

  return (
    <Menu>
      <MenuHandler>
        <button className="text-sm text-white">
          <Bars3Icon className="h-5 w-5" />
        </button>
      </MenuHandler>
      <MenuList>
        {routes.map((route) => (
          <MenuItem
            key={route.name}
            onClick={() => {
              navigate(route.path);
            }}
          >
            {route.name}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}
