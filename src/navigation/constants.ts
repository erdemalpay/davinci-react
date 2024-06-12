import Accounting from "../pages/Accounting";
import Analytics from "../pages/Analytics";
import Brand from "../pages/Brand";
import Checkout from "../pages/Checkout";
import Count from "../pages/Count";
import CountList from "../pages/CountList";
import CountListMenu from "../pages/CountListMenu";
import Expenses from "../pages/Expenses";
import Fixture from "../pages/Fixture";
import FixtureCountList from "../pages/FixtureCountList";
import FixtureCountListMenu from "../pages/FixtureCountListMenu";
import Gameplays from "../pages/Gameplays";
import Games from "../pages/Games";
import Memberships from "../pages/Memberships";
import Menu from "../pages/Menu";
import PanelControl from "../pages/PanelControl";
import Product from "../pages/Product";
import Profile from "../pages/Profile";
import Reservations from "../pages/Reservations";
import Rewards from "../pages/Rewards";
import Service from "../pages/Service";
import SingleCountArchive from "../pages/SingleCountArchive";
import Stocks from "../pages/Stocks";
import Tables from "../pages/Tables";
import User from "../pages/User";
import Users from "../pages/Users";
import Vendor from "../pages/Vendor";
import Visits from "../pages/Visits";
import { RoleEnum } from "./../types/index";

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
  Vendor = "/vendor/:vendorId",
  Brand = "/brand/:brandId",
  Fixture = "/fixture/:fixtureId",
  Service = "/service/:serviceId",
  SingleCountArchive = "/archive/:archiveId",
  CountListMenu = "/count-list-menu",
  FixtureCountListMenu = "/fixture-count-list-menu",
  CountList = "/count-list/:countListId",
  FixtureCountList = "/fixture-count-list/:fixtureCountListId",
  Checkout = "/checkout",
  PanelControl = "/panel-control",
}

export const allRoutes: {
  name: string;
  path: string;
  isOnSidebar: boolean;
  exceptionalRoles?: number[];
  element: () => JSX.Element;
}[] = [
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
  {
    name: "Count",
    path: Routes.Count,
    element: Count,
    isOnSidebar: false,
  },
  {
    name: "Count List",
    path: Routes.CountList,
    element: CountList,
    isOnSidebar: false,
  },
  {
    name: "Fixture Count List",
    path: Routes.FixtureCountList,
    element: FixtureCountList,
    isOnSidebar: false,
  },
  {
    name: "Single Count Archive",
    path: Routes.SingleCountArchive,
    element: SingleCountArchive,
    isOnSidebar: false,
  },
  {
    name: "Count List Menu",
    path: Routes.CountListMenu,
    element: CountListMenu,
    isOnSidebar: true,
  },
  {
    name: "Fixture Count List Menu",
    path: Routes.FixtureCountListMenu,
    element: FixtureCountListMenu,
    isOnSidebar: true,
  },
  {
    name: "Stocks",
    path: Routes.Stocks,
    element: Stocks,
    isOnSidebar: true,
  },
  {
    name: "Constants",
    path: Routes.Accounting,
    element: Accounting,
    isOnSidebar: true,
  },
  {
    name: "Product",
    path: Routes.Product,
    element: Product,
    isOnSidebar: false,
  },
  {
    name: "Service",
    path: Routes.Service,
    element: Service,
    isOnSidebar: false,
  },
  {
    name: "Vendor",
    path: Routes.Vendor,
    element: Vendor,
    isOnSidebar: false,
  },
  {
    name: "Brand",
    path: Routes.Brand,
    element: Brand,
    isOnSidebar: false,
  },
  {
    name: "Fixture",
    path: Routes.Fixture,
    element: Fixture,
    isOnSidebar: false,
  },
  {
    name: "Menu",
    path: Routes.Menu,
    element: Menu,
    isOnSidebar: true,
  },
  {
    name: "User",
    path: Routes.User,
    element: User,
    isOnSidebar: false,
  },
  {
    name: "Expenses",
    path: Routes.Expenses,
    element: Expenses,
    isOnSidebar: true,
  },
  {
    name: "Checkout",
    path: Routes.Checkout,
    element: Checkout,
    isOnSidebar: true,
  },
  {
    name: "Panel Control",
    path: Routes.PanelControl,
    element: PanelControl,
    isOnSidebar: true,
    exceptionalRoles: [RoleEnum.MANAGER],
  },
  {
    name: "Users",
    path: Routes.Users,
    element: Users,
    isOnSidebar: true,
  },
];

export const NO_IMAGE_URL =
  "https://res.cloudinary.com/dvbg/image/upload/ar_4:4,c_crop/c_fit,h_100/davinci/no-image_pyet1d.jpg";
