import { Tab } from "../components/panelComponents/shared/types";
import Accounting, { AccountingPageTabs } from "../pages/Accounting";
import Analytics from "../pages/Analytics";
import Brand from "../pages/Brand";
import Checkout from "../pages/Checkout";
import Count from "../pages/Count";
import CountList from "../pages/CountList";
import CountLists from "../pages/CountLists";
import Expenses from "../pages/Expenses";
import Fixture from "../pages/Fixture";
import FixtureCount from "../pages/FixtureCount";
import FixtureCountList from "../pages/FixtureCountList";
import Gameplays from "../pages/Gameplays";
import Games from "../pages/Games";
import Memberships from "../pages/Memberships";
import Menu from "../pages/Menu";
import PageDetails from "../pages/PageDetails";
import PanelControl from "../pages/PanelControl";
import Product from "../pages/Product";
import Profile from "../pages/Profile";
import Reservations from "../pages/Reservations";
import Rewards from "../pages/Rewards";
import Service from "../pages/Service";
import SingleCountArchive from "../pages/SingleCountArchive";
import SingleFixtureCountArchive from "../pages/SingleFixtureCountArchive";
import Stocks from "../pages/Stocks";
import Tables from "../pages/Tables";
import User from "../pages/User";
import Users from "../pages/Users";
import Vendor from "../pages/Vendor";
import Visits from "../pages/Visits";
import { CheckoutPageTabs } from "./../pages/Checkout";
import { ExpensePageTabs } from "./../pages/Expenses";
import { StockPageTabs } from "./../pages/Stocks";
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
  FixtureCount = "/fixture-count/:location/:countListId",
  Product = "/product/:productId",
  Vendor = "/vendor/:vendorId",
  Brand = "/brand/:brandId",
  Fixture = "/fixture/:fixtureId",
  Service = "/service/:serviceId",
  SingleCountArchive = "/archive/:archiveId",
  SingleFixtureCountArchive = "/fixture-archive/:archiveId",
  CountLists = "/count-lists",
  CountList = "/count-list/:countListId",
  FixtureCountList = "/fixture-count-list/:fixtureCountListId",
  Checkout = "/checkout",
  PanelControl = "/panel-control",
  PageDetails = "/page-details/:pageDetailsId",
}

export const allRoutes: {
  name: string;
  path: string;
  isOnSidebar: boolean;
  exceptionalRoles?: number[];
  element: () => JSX.Element;
  tabs?: Tab[];
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
    name: "Fixture Count",
    path: Routes.FixtureCount,
    element: FixtureCount,
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
    name: "Single Fixture Count Archive",
    path: Routes.SingleFixtureCountArchive,
    element: SingleFixtureCountArchive,
    isOnSidebar: false,
  },
  {
    name: "Count Lists",
    path: Routes.CountLists,
    element: CountLists,
    isOnSidebar: true,
  },
  {
    name: "Stocks",
    path: Routes.Stocks,
    element: Stocks,
    isOnSidebar: true,
    tabs: StockPageTabs,
  },
  {
    name: "Constants",
    path: Routes.Accounting,
    element: Accounting,
    isOnSidebar: true,
    tabs: AccountingPageTabs,
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
    tabs: ExpensePageTabs,
  },
  {
    name: "Checkout",
    path: Routes.Checkout,
    element: Checkout,
    isOnSidebar: true,
    tabs: CheckoutPageTabs,
  },
  {
    name: "Panel Control",
    path: Routes.PanelControl,
    element: PanelControl,
    isOnSidebar: true,
    exceptionalRoles: [RoleEnum.MANAGER],
  },
  {
    name: "Page Details",
    path: Routes.PageDetails,
    element: PageDetails,
    isOnSidebar: false,
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
