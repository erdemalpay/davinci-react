import { Tab } from "../components/panelComponents/shared/types";
import ExpenseTypeRoles from "../components/accounting/ExpenseTypeRoles";
import DisabledConditionActions from "../components/panelControl/DisabledConditionAction";
import Accounting, { AccountingPageTabs } from "../pages/Accounting";
import Analytics from "../pages/Analytics";
import Brand from "../pages/Brand";
import BulkProductAdding from "../pages/BulkProductAdding";
import ButtonCalls from "../pages/ButtonCalls";
import CafeActivity from "../pages/CafeActivity";
import Check from "../pages/Check";
import Checklist from "../pages/Checklist";
import Checklists, { ChecklistTabs } from "../pages/Checklists";
import Checkout from "../pages/Checkout";
import Consumer, { ConsumerPageTabs } from "../pages/Consumer";
import Count from "../pages/Count";
import CountList from "../pages/CountList";
import CountLists from "../pages/CountLists";
import DailySummary from "../pages/DailySummary";
import Education from "../pages/Education";
import Expenses from "../pages/Expenses";
import Expirations, { ExpirationTabs } from "../pages/Expiration";
import ExpirationCount from "../pages/ExpirationCount";
import ExpirationList from "../pages/ExpirationList";
import Feedback from "../pages/Feedback";
import Gameplays from "../pages/Gameplays";
import Games from "../pages/Games";
import Images from "../pages/Images";
import Integration, { IntegrationPageTabs } from "../pages/Integration";
import LocationPage, { LocationPageTabs } from "../pages/Location";
import Memberships from "../pages/Memberships";
import Menu from "../pages/Menu";
import MenuPrice from "../pages/MenuPrice";
import OnlineSales from "../pages/OnlineSales";
import OrderDatas from "../pages/OrderDatas";
import Orders from "../pages/Orders";
import OrdersSummary from "../pages/OrdersSummary";
import PageDetails from "../pages/PageDetails";
import PanelControl from "../pages/PanelControl";
import Points from "../pages/Points";
import Product from "../pages/Product";
import Profile, { ProfilePageTabs } from "../pages/Profile";
import Reservations from "../pages/Reservations";
import Rewards from "../pages/Rewards";
import Service from "../pages/Service";
import ShopifyPickUp from "../pages/ShopifyPickUp";
import SingleCheckArchive from "../pages/SingleCheckArchive";
import SingleCountArchive from "../pages/SingleCountArchive";
import SingleExpirationCountArchive from "../pages/SingleExpirationCountArchive";
import SingleFolderPage from "../pages/SingleFolderPage";
import StockHistoriesReports, {
  StockHistoriesReportsPageTabs,
} from "../pages/StockHistoriesReports";
import Stocks from "../pages/Stocks";
import Tables from "../pages/Tables";
import User from "../pages/User";
import UserActivities from "../pages/UserActivities";
import Users from "../pages/Users";
import Vendor from "../pages/Vendor";
import Visits from "../pages/Visits";
import { BrandPageTabs } from "./../pages/Brand";
import { CheckoutPageTabs } from "./../pages/Checkout";
import { ExpensePageTabs } from "./../pages/Expenses";
import Notifications, { NotificationPageTabs } from "./../pages/Notifications";
import { OrderDataTabs } from "./../pages/OrderDatas";
import { PointsPageTabs } from "./../pages/Points";
import { ProductPageTabs } from "./../pages/Product";
import { StockPageTabs } from "./../pages/Stocks";
import { VendorPageTabs } from "./../pages/Vendor";
import { VisitPageTabs } from "./../pages/Visits";
import WebhookLogs from "./../pages/WebhookLogs";
import { RoleEnum } from "./../types/index";

export enum PublicRoutes {
  NotFound = "*",
  Login = "/login",
}

export enum Routes {
  Games = "/games",
  Feedback = "/feedback",
  Memberships = "/memberships",
  Reservations = "/reservations",
  Rewards = "/rewards",
  Tables = "/tables",
  NewTables = "/new-tables",
  OnlineSales = "/online-sales",
  Visits = "/visits",
  Education = "/education",
  Menu = "/menu",
  MenuPrice = "/menu-price",
  User = "/user/:userId",
  Orders = "/orders",
  Users = "/users",
  Analytics = "/analytics",
  Gameplays = "/gameplays",
  Profile = "/profile",
  Accounting = "/accounting",
  Expenses = "/expenses",
  Stocks = "/stocks",
  Integration = "/integration",
  StockHistoriesReports = "/stock-histories-reports",
  Count = "/count/:location/:countListId",
  Check = "/check/:location/:checklistId",
  Product = "/product/:productId",
  Vendor = "/vendor/:vendorId",
  Brand = "/brand/:brandId",
  Service = "/service/:serviceId",
  SingleCountArchive = "/archive/:archiveId",
  SingleCheckArchive = "/check-archive/:archiveId",
  SingleFolderPage = "/folder/:folderName",
  CountLists = "/count-lists",
  CountList = "/count-list/:countListId",
  Checkout = "/checkout",
  PanelControl = "/panel-control",
  PageDetails = "/page-details/:pageDetailsId",
  DisabledConditionActions = "/disabled-condition/:disabledConditionId",
  ExpenseTypeRoles = "/expense-type-roles/:expenseTypeId",
  OrderDatas = "/order-datas",
  UserActivities = "/user-activities",
  OrdersSummary = "/orders-summary",
  Images = "/images",
  BulkProductAdding = "/bulk-product-adding",
  Checklists = "/checklists",
  Checklist = "/checklist/:checklistId",
  ButtonCalls = "/button-calls",
  Notifications = "/notifications",
  Expirations = "/expirations",
  ExpirationList = "/expiration-list/:expirationListId",
  ExpirationCount = "/expiration/:location/:expirationListId",
  SingleExpirationCountArchive = "/expiration-archive/:archiveId",
  Location = "/location/:locationId",
  Activities = "/activities",
  DailySummary = "/daily-summary",
  IkasPickUp = "/ikas-pickup",
  ShopifyPickUp = "/shopify-pickup",
  Points = "/points",
  Consumers = "/consumers",
  WebhookLogs = "/webhook-logs",
  BackInStock = "/back-in-stock",
}

export const allRoutes: {
  name: string;
  path?: string;
  isOnSidebar: boolean;
  exceptionalRoles?: number[];
  link?: string;
  element?: () => JSX.Element;
  tabs?: Tab[];
  children?: typeof allRoutes;
}[] = [
  {
    name: "Tables",
    path: Routes.Tables,
    element: Tables,
    isOnSidebar: true,
    children: [
      {
        name: "Tables",
        path: Routes.Tables,
        element: Tables,
        isOnSidebar: true,
      },
      {
        name: "Online Sales",
        path: Routes.OnlineSales,
        element: OnlineSales,
        isOnSidebar: true,
      },
      {
        name: "Feedbacks",
        path: Routes.Feedback,
        element: Feedback,
        isOnSidebar: true,
      },
    ],
  },
  {
    name: "Tables",
    path: Routes.Tables,
    element: Tables,
    isOnSidebar: false,
  },
  {
    name: "Online Sales",
    path: Routes.OnlineSales,
    element: OnlineSales,
    isOnSidebar: false,
  },
  {
    name: "Feedbacks",
    path: Routes.Feedback,
    element: Feedback,
    isOnSidebar: false,
  },
  {
    name: "Daily Summary",
    path: Routes.DailySummary,
    element: DailySummary,
    isOnSidebar: true,
  },
  {
    name: "Orders",
    path: Routes.Orders,
    element: Orders,
    isOnSidebar: true,
  },
  {
    name: "Orders Details",
    path: Routes.OrdersSummary,
    element: OrdersSummary,
    isOnSidebar: true,
    children: [
      {
        name: "Orders Summary",
        path: Routes.OrdersSummary,
        element: OrdersSummary,
        isOnSidebar: true,
      },
      {
        name: "Order Datas",
        path: Routes.OrderDatas,
        element: OrderDatas,
        isOnSidebar: true,
        tabs: OrderDataTabs,
      },
    ],
  },
  {
    name: "Orders Summary",
    path: Routes.OrdersSummary,
    element: OrdersSummary,
    isOnSidebar: false,
  },
  {
    name: "Order Datas",
    path: Routes.OrderDatas,
    element: OrderDatas,
    isOnSidebar: false,
    tabs: OrderDataTabs,
  },
  // {
  //   name: "Ikas Pick Up",
  //   path: Routes.IkasPickUp,
  //   element: IkasPickUp,
  //   isOnSidebar: true,
  // },
  {
    name: "Shopify Pick Up",
    path: Routes.ShopifyPickUp,
    element: ShopifyPickUp,
    isOnSidebar: true,
  },
  {
    name: "Reservations",
    path: Routes.Reservations,
    element: Reservations,
    isOnSidebar: true,
    children: [
      {
        name: "Reservations",
        path: Routes.Reservations,
        element: Reservations,
        isOnSidebar: true,
      },
      {
        name: "Activities",
        path: Routes.Activities,
        element: CafeActivity,
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
    ],
  },
  {
    name: "Reservations",
    path: Routes.Reservations,
    element: Reservations,
    isOnSidebar: false,
  },
  {
    name: "Activities",
    path: Routes.Activities,
    element: CafeActivity,
    isOnSidebar: false,
  },
  {
    name: "Memberships",
    path: Routes.Memberships,
    element: Memberships,
    isOnSidebar: false,
  },
  {
    name: "Rewards",
    path: Routes.Rewards,
    element: Rewards,
    isOnSidebar: false,
  },
  {
    name: "Games",
    path: Routes.Games,
    element: Games,
    isOnSidebar: true,
    children: [
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
        name: "Analytics",
        path: Routes.Analytics,
        element: Analytics,
        isOnSidebar: true,
      },
    ],
  },
  {
    name: "Games",
    path: Routes.Games,
    element: Games,
    isOnSidebar: false,
  },
  {
    name: "Button Calls",
    path: Routes.ButtonCalls,
    element: ButtonCalls,
    isOnSidebar: true,
  },
  {
    name: "Gameplays",
    path: Routes.Gameplays,
    element: Gameplays,
    isOnSidebar: false,
  },
  {
    name: "Analytics",
    path: Routes.Analytics,
    element: Analytics,
    isOnSidebar: false,
  },
  {
    name: "Shifts",
    path: Routes.Visits,
    element: Visits,
    isOnSidebar: true,
    tabs: VisitPageTabs,
  },
  {
    name: "Notifications",
    path: Routes.Notifications,
    element: Notifications,
    isOnSidebar: false,
    tabs: NotificationPageTabs,
  },
  {
    name: "Images",
    path: Routes.Images,
    element: Images,
    isOnSidebar: false,
  },
  {
    name: "Single Folder Page",
    path: Routes.SingleFolderPage,
    element: SingleFolderPage,
    isOnSidebar: false,
  },
  {
    name: "Profile",
    path: Routes.Profile,
    element: Profile,
    isOnSidebar: true,
    tabs: ProfilePageTabs,
  },

  {
    name: "User Activities",
    path: Routes.UserActivities,
    element: UserActivities,
    isOnSidebar: false,
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
    name: "Single Count Archive",
    path: Routes.SingleCountArchive,
    element: SingleCountArchive,
    isOnSidebar: false,
  },
  {
    name: "Count Lists",
    path: Routes.CountLists,
    element: CountLists,
    isOnSidebar: true,
    children: [
      {
        name: "Count Lists",
        path: Routes.CountLists,
        element: CountLists,
        isOnSidebar: true,
      },
      {
        name: "Checklists",
        path: Routes.Checklists,
        element: Checklists,
        isOnSidebar: true,
        tabs: ChecklistTabs,
      },
      {
        name: "Expirations",
        path: Routes.Expirations,
        element: Expirations,
        isOnSidebar: true,
        tabs: ExpirationTabs,
      },
    ],
  },
  {
    name: "Count Lists",
    path: Routes.CountLists,
    element: CountLists,
    isOnSidebar: false,
  },
  {
    name: "Checklists",
    path: Routes.Checklists,
    element: Checklists,
    isOnSidebar: false,
    tabs: ChecklistTabs,
  },
  {
    name: "Checklist",
    path: Routes.Checklist,
    element: Checklist,
    isOnSidebar: false,
  },
  {
    name: "Check",
    path: Routes.Check,
    element: Check,
    isOnSidebar: false,
  },
  {
    name: "Single Check Archive",
    path: Routes.SingleCheckArchive,
    element: SingleCheckArchive,
    isOnSidebar: false,
  },
  {
    name: "Expirations",
    path: Routes.Expirations,
    element: Expirations,
    isOnSidebar: false,
    tabs: ExpirationTabs,
  },
  {
    name: "Expiration Count",
    path: Routes.ExpirationCount,
    element: ExpirationCount,
    isOnSidebar: false,
  },
  {
    name: "ExpirationList",
    path: Routes.ExpirationList,
    element: ExpirationList,
    isOnSidebar: false,
  },
  {
    name: "Single Expiration Count Archive",
    path: Routes.SingleExpirationCountArchive,
    element: SingleExpirationCountArchive,
    isOnSidebar: false,
  },
  {
    name: "Stocks",
    path: Routes.Stocks,
    element: Stocks,
    isOnSidebar: true,
    tabs: StockPageTabs,
    children: [
      {
        name: "Stocks",
        path: Routes.Stocks,
        element: Stocks,
        isOnSidebar: true,
        tabs: StockPageTabs,
      },
      {
        name: "Integration",
        path: Routes.Integration,
        element: Integration,
        isOnSidebar: true,
        tabs: IntegrationPageTabs,
      },
      {
        name: "Stock Histories Reports",
        path: Routes.StockHistoriesReports,
        element: StockHistoriesReports,
        isOnSidebar: true,
        tabs: StockHistoriesReportsPageTabs,
      },
    ],
  },
  {
    name: "Integration",
    path: Routes.Integration,
    element: Integration,
    isOnSidebar: false,
    tabs: IntegrationPageTabs,
  },
  {
    name: "Stock Histories Reports",
    path: Routes.StockHistoriesReports,
    element: StockHistoriesReports,
    isOnSidebar: false,
    tabs: StockHistoriesReportsPageTabs,
  },
  {
    name: "Constants",
    path: Routes.Accounting,
    element: Accounting,
    isOnSidebar: true,
    tabs: AccountingPageTabs,
    children: [
      {
        name: "Constants",
        path: Routes.Accounting,
        element: Accounting,
        isOnSidebar: true,
        tabs: AccountingPageTabs,
      },
      {
        name: "Images",
        path: Routes.Images,
        element: Images,
        isOnSidebar: true,
      },
    ],
  },
  {
    name: "Constants",
    path: Routes.Accounting,
    element: Accounting,
    isOnSidebar: false,
    tabs: AccountingPageTabs,
  },
  {
    name: "Product",
    path: Routes.Product,
    element: Product,
    isOnSidebar: false,
    tabs: ProductPageTabs,
  },
  {
    name: "Location",
    path: Routes.Location,
    element: LocationPage,
    isOnSidebar: false,
    tabs: LocationPageTabs as any,
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
    tabs: VendorPageTabs,
  },
  {
    name: "Brand",
    path: Routes.Brand,
    element: Brand,
    isOnSidebar: false,
    tabs: BrandPageTabs,
  },
  {
    name: "Menu",
    path: Routes.Menu,
    element: Menu,
    isOnSidebar: true,
    children: [
      {
        name: "Menu",
        path: Routes.Menu,
        element: Menu,
        isOnSidebar: true,
      },
      {
        name: "Menu Price",
        path: Routes.MenuPrice,
        element: MenuPrice,
        isOnSidebar: true,
      },
      {
        name: "Bulk Product Adding",
        path: Routes.BulkProductAdding,
        element: BulkProductAdding,
        isOnSidebar: true,
      },
    ],
  },
  {
    name: "Menu",
    path: Routes.Menu,
    element: Menu,
    isOnSidebar: false,
  },
  {
    name: "Menu Price",
    path: Routes.MenuPrice,
    element: MenuPrice,
    isOnSidebar: false,
  },
  {
    name: "Bulk Product Adding",
    path: Routes.BulkProductAdding,
    element: BulkProductAdding,
    isOnSidebar: false,
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
    children: [
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
    ],
  },
  {
    name: "Expenses",
    path: Routes.Expenses,
    element: Expenses,
    isOnSidebar: false,
    tabs: ExpensePageTabs,
  },
  {
    name: "Checkout",
    path: Routes.Checkout,
    element: Checkout,
    isOnSidebar: false,
    tabs: CheckoutPageTabs,
  },
  {
    name: "Users",
    path: Routes.Users,
    element: Users,
    isOnSidebar: true,
    children: [
      {
        name: "Users",
        path: Routes.Users,
        element: Users,
        isOnSidebar: true,
      },
      {
        name: "User Activities",
        path: Routes.UserActivities,
        element: UserActivities,
        isOnSidebar: true,
      },
    ],
  },
  {
    name: "Users",
    path: Routes.Users,
    element: Users,
    isOnSidebar: false,
  },

  {
    name: "Education",
    path: Routes.Education,
    element: Education,
    isOnSidebar: false,
  },
  {
    name: "Points",
    path: Routes.Points,
    element: Points,
    isOnSidebar: true,
    tabs: PointsPageTabs,
  },
  {
    name: "Consumers",
    path: Routes.Consumers,
    element: Consumer,
    isOnSidebar: true,
    tabs: ConsumerPageTabs,
  },
  {
    name: "Panel",
    path: Routes.PanelControl,
    exceptionalRoles: [RoleEnum.MANAGER],
    element: PanelControl,
    isOnSidebar: true,
    children: [
      {
        name: "Panel Control",
        path: Routes.PanelControl,
        element: PanelControl,
        isOnSidebar: true,
        exceptionalRoles: [RoleEnum.MANAGER],
      },
      {
        name: "Education",
        path: Routes.Education,
        element: Education,
        isOnSidebar: true,
      },
      {
        name: "Webhook Logs",
        path: Routes.WebhookLogs,
        element: WebhookLogs,
        isOnSidebar: true,
        exceptionalRoles: [RoleEnum.MANAGER],
      },
      {
        name: "Notifications",
        path: Routes.Notifications,
        element: Notifications,
        isOnSidebar: true,
        tabs: NotificationPageTabs,
      },
    ],
  },
  {
    name: "Panel Control",
    path: Routes.PanelControl,
    element: PanelControl,
    isOnSidebar: false,
    exceptionalRoles: [RoleEnum.MANAGER],
  },
  {
    name: "Webhook Logs",
    path: Routes.WebhookLogs,
    element: WebhookLogs,
    isOnSidebar: false,
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
    name: "Disabled Condition Actions",
    path: Routes.DisabledConditionActions,
    element: DisabledConditionActions,
    isOnSidebar: false,
    exceptionalRoles: [RoleEnum.MANAGER],
  },
  {
    name: "Expense Type Roles",
    path: Routes.ExpenseTypeRoles,
    element: ExpenseTypeRoles,
    isOnSidebar: false,
    exceptionalRoles: [RoleEnum.MANAGER],
  },
  {
    name: "Links",
    isOnSidebar: true,
    children: [
      {
        name: "ShiftLink",
        link: "https://docs.google.com/spreadsheets/d/12I0SfAT97zDFjyLHnujv9pIKCUkCpLUfX36MXPK1Bek/edit",
        isOnSidebar: true,
      },
      {
        name: "Oyun Bakımı",
        link: "https://docs.google.com/spreadsheets/d/1r_8gDsQCBNKUJX4VeQtkkfZqUUQAgkQnm1a_NQg8YUA/edit",
        isOnSidebar: true,
      },
      {
        name: "Activities",
        link: "https://docs.google.com/spreadsheets/d/13C_TCrb2gkFifWkYkCDyggyAA4RNDmk_aVrCXnZ2P6Q/edit",
        isOnSidebar: true,
      },
    ],
  },
  {
    name: "ShiftLink",
    link: "https://docs.google.com/spreadsheets/d/12I0SfAT97zDFjyLHnujv9pIKCUkCpLUfX36MXPK1Bek/edit",
    isOnSidebar: false,
  },
  {
    name: "Oyun Bakımı",
    link: "https://docs.google.com/spreadsheets/d/1r_8gDsQCBNKUJX4VeQtkkfZqUUQAgkQnm1a_NQg8YUA/edit",
    isOnSidebar: false,
  },
  {
    name: "Activities",
    link: "https://docs.google.com/spreadsheets/d/13C_TCrb2gkFifWkYkCDyggyAA4RNDmk_aVrCXnZ2P6Q/edit",
    isOnSidebar: false,
  },
];

export const NO_IMAGE_URL =
  "https://res.cloudinary.com/dvbg/image/upload/ar_4:4,c_crop/c_fit,h_100/davinci/no-image_pyet1d.jpg";
