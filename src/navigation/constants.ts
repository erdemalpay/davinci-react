import Accounting from "../pages/Accounting";
import Analytics from "../pages/Analytics";
import Count from "../pages/Count";
import CountListMenu from "../pages/CountListMenu";
import Expenses from "../pages/Expenses";
import Fixture from "../pages/Fixture";
import Gameplays from "../pages/Gameplays";
import Games from "../pages/Games";
import Memberships from "../pages/Memberships";
import Menu from "../pages/Menu";
import Product from "../pages/Product";
import Profile from "../pages/Profile";
import Reservations from "../pages/Reservations";
import Rewards from "../pages/Rewards";
import SingleCountArchive from "../pages/SingleCountArchive";
import Stocks from "../pages/Stocks";
import Tables from "../pages/Tables";
import User from "../pages/User";
import Users from "../pages/Users";
import Visits from "../pages/Visits";
import { RoleEnum, RolePermissionEnum } from "../types";

export enum PublicRoutes {
  NotFound = "*",
  Login = "/login",
}

export enum Routes {
  Games = "/games",
  Memberships = "/memberships",
  Reservations = "/reservations",
  Rewards = "/rewards",
  Tables = "/tables",
  Visits = "/visits",
  Menu = "/menu",
  User = "/user/:userId",
  Users = "/users",
  Analytics = "/analytics",
  Gameplays = "/gameplays",
  Profile = "/profile",
  Accounting = "/accounting",
  Expenses = "/expenses",
  Stocks = "/stocks",
  Count = "/count/:location/:countListId",
  Product = "/product/:productId",
  Fixture = "/fixture/:fixtureId",
  SingleCountArchive = "/archive/:archiveId",
  CountListMenu = "/count-list-menu",
}

export const allRoutes: {
  [K in RolePermissionEnum]: {
    name: string;
    path: string;
    isOnSidebar: boolean;
    exceptionRoleIds?: number[];
    disabledRoleIds?: number[];
    element: () => JSX.Element;
  }[];
} = {
  [RolePermissionEnum.OPERATION]: [
    {
      name: "Tables",
      path: Routes.Tables,
      element: Tables,
      isOnSidebar: true,
    },
    {
      name: "Reservations",
      path: Routes.Reservations,
      element: Reservations,
      isOnSidebar: true,
    },

    {
      name: "Games",
      path: Routes.Games,
      element: Games,
      isOnSidebar: true,
    },

    {
      name: "Gameplays",
      path: Routes.Gameplays,
      element: Gameplays,
      isOnSidebar: true,
    },
    {
      name: "Memberships",
      path: Routes.Memberships,
      element: Memberships,
      isOnSidebar: true,
    },
    {
      name: "Rewards",
      path: Routes.Rewards,
      element: Rewards,
      isOnSidebar: true,
    },

    {
      name: "Visits",
      path: Routes.Visits,
      element: Visits,
      isOnSidebar: true,
    },
    {
      name: "Profile",
      path: Routes.Profile,
      element: Profile,
      isOnSidebar: true,
    },
    {
      name: "Analytics",
      path: Routes.Analytics,
      element: Analytics,
      isOnSidebar: true,
    },
  ],
  [RolePermissionEnum.MANAGEMENT]: [
    {
      name: "Menu",
      path: Routes.Menu,
      element: Menu,
      isOnSidebar: true,
      exceptionRoleIds: [RoleEnum.BARISTA],
    },
    {
      name: "User",
      path: Routes.User,
      element: User,
      isOnSidebar: false,
    },
    {
      name: "Count",
      path: Routes.Count,
      element: Count,
      isOnSidebar: false,
    },
    {
      name: "Product",
      path: Routes.Product,
      element: Product,
      isOnSidebar: false,
    },
    {
      name: "Fixture",
      path: Routes.Fixture,
      element: Fixture,
      isOnSidebar: false,
    },
    {
      name: "Single Count Archive",
      path: Routes.SingleCountArchive,
      element: SingleCountArchive,
      isOnSidebar: false,
    },
    {
      name: "Accounting",
      path: Routes.Accounting,
      element: Accounting,
      isOnSidebar: true,
      disabledRoleIds: [RoleEnum.GAMEMANAGER],
    },
    {
      name: "Count List Menu",
      path: Routes.CountListMenu,
      element: CountListMenu,
      isOnSidebar: true,
      disabledRoleIds: [RoleEnum.GAMEMANAGER],
    },
    {
      name: "Expenses",
      path: Routes.Expenses,
      element: Expenses,
      isOnSidebar: true,
      disabledRoleIds: [RoleEnum.GAMEMANAGER],
    },
    {
      name: "Stocks",
      path: Routes.Stocks,
      element: Stocks,
      isOnSidebar: true,
      disabledRoleIds: [RoleEnum.GAMEMANAGER],
    },
    {
      name: "Users",
      path: Routes.Users,
      element: Users,
      isOnSidebar: true,
    },
  ],
};

export const NO_IMAGE_URL =
  "https://res.cloudinary.com/dvbg/image/upload/ar_4:4,c_crop/c_fit,h_100/davinci/no-image_pyet1d.jpg";
