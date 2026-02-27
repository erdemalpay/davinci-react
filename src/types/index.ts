export type Gameplay = {
  _id: number;
  date: string;
  startHour: string;
  finishHour?: string;
  playerCount: number;
  game?: Game | number;
  mentor: User | string;
  location: number;
  createdBy: User;
  isGameplayTime?: boolean;
};

export type GameplayTime = {
  _id: number;
  user: User | string;
  location: Location | number;
  gameplay:
    | {
        _id: number;
        mentor: User | string;
        game: Game | number;
        playerCount: number;
      }
    | number;
  table:
    | {
        _id: number;
        name: string;
      }
    | number;
  date: string;
  startHour?: string;
  finishHour?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Authorization = {
  _id: number;
  path: string;
  method: string;
  roles: number[];
  relatedPages?: string[];
};

export type Action = {
  _id: string;
  name: string;
};
export type TaskTrack = {
  _id: number;
  task: string;
  users: string[];
  type: string[];
  createdAt: Date;
};

export type ReleaseNoteItem = {
  title: string;
  description?: string;
};

export type ReleaseNote = {
  _id: number;
  releaseId: string;
  title: string;
  date: string;
  items: ReleaseNoteItem[];
  isPublished: boolean;
};

export type Point = {
  _id: number;
  user?: string;
  consumer?: Partial<Consumer>;
  amount: number;
};

export type PointHistory = {
  _id: number;
  point: number;
  pointUser?: Partial<User>;
  pointConsumer?: Partial<Consumer>;
  createdBy: Partial<User>;
  collectionId?: number;
  tableId?: number;
  status: string;
  currentAmount: number;
  change: number;
  createdAt: Date;
};

export enum PointHistoryStatusEnum {
  POINTCREATE = "POINTCREATE",
  POINTUPDATE = "POINTUPDATE",
  POINTDELETE = "POINTDELETE",
  COLLECTIONCREATED = "COLLECTIONCREATED",
  COLLECTIONCANCELLED = "COLLECTIONCANCELLED",
}

export const pointHistoryStatuses = [
  {
    value: PointHistoryStatusEnum.POINTCREATE,
    label: "Point Create",
    backgroundColor: "bg-green-500",
  },
  {
    value: PointHistoryStatusEnum.POINTUPDATE,
    label: "Point Update",
    backgroundColor: "bg-yellow-500",
  },
  {
    value: PointHistoryStatusEnum.POINTDELETE,
    label: "Point Delete",
    backgroundColor: "bg-red-500",
  },
  {
    value: PointHistoryStatusEnum.COLLECTIONCREATED,
    label: "Collection Created",
    backgroundColor: "bg-blue-500",
  },
  {
    value: PointHistoryStatusEnum.COLLECTIONCANCELLED,
    label: "Collection Cancelled",
    backgroundColor: "bg-orange-500",
  },
];

export type DisabledCondition = {
  _id: string;
  name: string;
  page: string;
  actions: {
    action: string;
    permissionsRoles: number[];
  }[];
};

export enum ConsumerStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export type Consumer = {
  _id: number;
  name: string;
  surname: string;
  userName: string;
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
  address?: string;
  profileImage?: string;
  birthDate?: Date;
  status: ConsumerStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type Location = {
  _id: number;
  name: string;
  tableCount?: number;
  type: number[];
  active: boolean;
  activityNote?: string;
  ikasId?: string;
  shopifyId?: string;
  backgroundColor?: string;
  shifts?: {
    shift: string;
    shiftEndHour: string;
    isActive: boolean;
    type: string;
  }[];
  tableNames?: string[];
  isShelfInfoRequired?: boolean;
  isVisibleInBaseQuantity?: boolean;
  seenInOrdersSummaryPage?: boolean;
  phoneNumber?: string;
  fallbackStockLocation?: number;
  googleMapsUrl?: string;
  dailyHours?: {
    day: string;
    openingTime?: string;
    closingTime?: string;
    isClosed?: boolean;
  }[];
};
export enum LocationShiftType {
  FULLTIME = "fulltime",
  PARTTIME = "parttime",
}

export type Table = {
  _id: number;
  name: string;
  type?: string;
  date: string;
  playerCount: number;
  location: number;
  startHour: string;
  finishHour?: string;
  orders?: number[];
  tables?: string[];
  gameplays: Gameplay[];
  status?: string;
  isOnlineSale?: boolean;
  isAutoEntryAdded: boolean;
  createdBy: string;
};

export type Role = {
  _id: number;
  name: string;
  color: string;
  permissions: RolePermissionEnum[];
};
export type Feedback = {
  _id: number;
  location: number;
  table: number;
  comment?: string;
  starRating?: number;
  createdAt: Date;
};
export enum WorkType {
  FULLTIME = "Full Time",
  PARTTIME = "Part Time",
}

export type User = {
  _id: string;
  name: string;
  fullName: string;
  cafeId: string;
  active: boolean;
  role: Role;
  jobStartDate: Date;
  jobEndDate?: Date;
  insuranceStartDate: Date;
  profileImage?: string;
  phone: string;
  address: string;
  iban: string;
  birthDate: Date;
  imageUrl: string;
  workType: WorkType;
  rowsPerPage?: number;
  language?: string;
  userGames: [
    {
      game: number;
      learnDate: string;
    }
  ];
  settings?: {
    orderCategoryOn?: boolean;
  };
};

export type Game = {
  _id: number;
  name: string;
  image: string;
  thumbnail: string;
  expansion: boolean;
  locations: number[];
  narrationDurationPoint?: number;
};
export type AccountProduct = {
  _id: string;
  name: string;
  expenseType: string[];
  vendor?: string[];
  brand?: string[];
  unitPrice: number;
  matchedMenuItem?: number;
  deleted?: boolean;
  baseQuantities?: {
    location: number;
    minQuantity: number;
    maxQuantity: number;
  }[];
  shelfInfo?: {
    location: number;
    shelf: string;
  }[];
};
export type AccountService = {
  _id: string;
  name: string;
  expenseType: string[];
  vendor?: string[];
  unitPrice: number;
};

export type AccountCountList = {
  _id: string;
  name: string;
  locations: number[];
  products?: {
    product: string;
    locations: number[];
  }[];
  active: boolean;
  expenseTypes?: string[];
};
export type ExpirationListType = {
  _id: string;
  name: string;
  locations: number[];
  products?: {
    product: string;
    locations: number[];
  }[];
  active: boolean;
};

export type AccountCountProduct = {
  product: string;
  stockQuantity: number;
  countQuantity: number;
  isStockEqualized?: boolean;
  productDeleteRequest?: string;
};
export type AccountCount = {
  _id: string;
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
  location: number;
  user: string;
  products?: AccountCountProduct[];
  countList: string;
};

export type ChecklistType = {
  _id: string;
  name: string;
  locations: number[];
  active: boolean;
  duties?: {
    duty: string;
    order: number;
    description?: string;
    locations: number[];
  }[];
};

export type CheckType = {
  _id: string;
  user: string;
  location: number;
  checklist: string;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  duties: {
    duty: string;
    isCompleted: boolean;
  }[];
};

export type AccountExpenseType = {
  _id: string;
  name: string;
  backgroundColor: string;
  isRoleRestricted: boolean;
  pagePermissions: { page: string; allowedRoles: number[] }[];
};

export type ProductCategories = {
  _id: string;
  name: string;
  ikasId?: string;
  shopifyId?: string;
};

export type AccountBrand = {
  _id: string;
  name: string;
};
export type AccountVendor = {
  _id: string;
  name: string;
};

export type AccountPaymentMethod = {
  _id: string;
  name: string;
  isConstant: boolean;
  isOnlineOrder?: boolean;
  ikasId?: string;
  isPaymentMade?: boolean;
  isUsedAtExpense?: boolean;
  isPointPayment?: boolean;
};
export type AccountPayment = {
  _id: number;
  vendor: string;
  invoice?: number;
  serviceInvoice?: number;
  paymentMethod: string;
  location: number;
  user: string;
  date: string;
  amount: number;
  createdAt?: Date;
  isAfterCount?: boolean;
};
export type AccountOverallExpense = {
  _id: number;
  product: string;
  expenseType: string;
  quantity: number;
  totalExpense: number;
  date: string;
  brand?: string;
  vendor?: string;
  note?: string;
  location: number;
  price?: number;
  vat?: number;
  service: string;
  type: string;
  paymentMethod: string;
  createdAt?: Date;
  discount?: number;
};

export type AccountExpense = {
  _id: number;
  product?: string;
  type: string;
  service?: string;
  expenseType: string;
  quantity: number;
  totalExpense: number;
  date: string;
  brand?: string;
  vendor?: string;
  note?: string;
  location: number;
  price?: number;
  vat?: number;
  paymentMethod: string;
  isPaid: boolean;
  isStockIncrement?: boolean;
  createdAt?: Date;
  isAfterCount: boolean;
  discount?: number;
};

export type AccountStock = {
  _id: string;
  product: string;
  location: number;
  quantity: number;
};
export type AccountProductStockHistory = {
  _id: number;
  product: string;
  location: number;
  change: number;
  currentAmount: number;
  status: string;
  user: string;
  createdAt: Date;
};

export enum VisitSource {
  PANEL = "panel",
  FACE_RECOGNITION = "face_recognition",
}

export type Visit = {
  _id: number;
  location: number;
  date: string;
  user: string;
  startHour: string;
  finishHour?: string;
  visitStartSource?: VisitSource;
  visitFinishSource?: VisitSource;
};

export type Break = {
  _id: number;
  user: User | string;
  location: number;
  date: string;
  startHour: string;
  finishHour?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type CreateBreakDto = {
  user: string;
  location: number;
  date: string;
  startHour: string;
};

export type UpdateBreakDto = {
  finishHour?: string;
  startHour?: string;
  date?: string;
  user?: string;
  location?: number;
};

export enum ButtonCallTypeEnum {
  TABLECALL = "TABLECALL",
  GAMEMASTERCALL = "GAMEMASTERCALL",
  ORDERCALL = "ORDERCALL",
}
export const buttonCallTypes = [
  {
    value: ButtonCallTypeEnum.TABLECALL,
    label: "Table Call",
    backgroundColor: "bg-green-500",
  },
  {
    value: ButtonCallTypeEnum.GAMEMASTERCALL,
    label: "Game Master Call",
    backgroundColor: "bg-blue-500",
  },
  {
    value: ButtonCallTypeEnum.ORDERCALL,
    label: "Order Call",
    backgroundColor: "bg-orange-500",
  },
];

export type ButtonCall = {
  _id: string;
  tableName: string;
  location: number;
  locationName?: string;
  date: string;
  type: ButtonCallTypeEnum;
  startHour: string;
  finishHour?: string;
  createdBy?: string;
  cancelledBy?: string;
  cancelledByName?: string;
  duration?: number;
  callCount: number;
};

export enum ButtonCallType {
  ACTIVE = "active",
  CLOSED = "closed",
}

export enum DisabledConditionEnum {
  STOCK_STOCK = "stocks",
  GAMES_GAMES = "games",
  BUTTONCALLS_BUTTONCALLS = "button_calls",
  PANELCONTROL_DISABLEDCONDITIONS = "disabled_conditions",
  PANELCONTROL_ROUTEAUTHORIZATIONPERMISSIONS = "route_authorization_permissions",
  PANELCONTROL_EDUCATIONPERMISSIONS = "education_permissions",
  STOCK_GAMESTOCK = "gamestock",
  STOCK_DESSERTSTOCK = "dessertstock",
  STOCK_COLDDRINKSTOCK = "colddrinkstock",
  STOCK_GAMESTOCKLOCATION = "gamestocklocation",
  STOCK_BASEQUANTITYBYLOCATION = "basequantitybylocation",
  STOCK_PRODUCTSHELFINFO = "productshelfinfo",
  STOCK_VENDORORDER = "vendororder",
  STOCK_IKASSTOCKCOMPARISION = "ikasstockcomparision",
  STOCK_IKASPRICECOMPARISION = "ikaspricecomparision",
  STOCK_SHOPIFYSTOCKCOMPARISION = "shopifystockcomparision",
  STOCK_SHOPIFYPRICECOMPARISION = "shopifypricecomparision",
  STOCK_HEPSIBURADAPRICECOMPARISION = "hepsiburadapricecomparision",
  STOCK_HEPSIBURADASTOCKCOMPARISION = "hepsiburadastockcomparision",
  STOCK_ENTERCONSUMPTION = "enterconsumption",
  STOCK_LOSSPRODUCT = "lossproduct",
  ORDERDATAS_DAILYINCOME = "dailyincome",
  ORDERDATAS_GROUPEDPRODUCTSALESREPORT = "groupedproductsalesreport",
  ORDERDATAS_SINGLEPRODUCTSALESREPORT = "singleproductsalesreport",
  ORDERDATAS_UPPERCATEGORYBASEDSALESREPORT = "uppercategorybasedsalesreport",
  ORDERDATAS_CATEGORYBASEDSALESREPORT = "categorybasedsalesreport",
  ORDERDATAS_DISCOUNTBASEDSALES = "discountbasedsales",
  ORDERDATAS_COLLECTIONS = "collections",
  ORDERDATAS_HEPSIBURADAORDERS = "hepsiburadaorders",
  ORDERDATAS_ORDERS = "orders",
  ORDERDATAS_IKASORDERS = "ikasorders",
  ORDERDATAS_SHOPIFYORDERS = "shopifyorders",
  ORDERDATAS_TRENDYOLORDERS = "trendyolorders",
  ORDERDATAS_PERSONALORDERDATAS = "personalorderdatas",
  ORDERDATAS_KITCHENDATAPAGE = "kitchendatapage",
  IKAS_PICK_UP = "ikas_pick_up",
  SHOPIFY_PICK_UP = "shopify_pick_up",
  RESERVATIONS = "reservations",
  ANALYTICS_TABLEPLAYERCOUNTS = "tableplayercounts",
  ANALYTICS_GAMEPLAYSBYMENTORSDETAILS = "gameplaysbymentorsdetails",
  ANALYTICS_KNOWNGAMESCOUNT = "knowngamescount",
  ANALYTICS_WHOKNOWS = "whoknows",
  CAFE_ACTIVITIES = "cafe_activities",
  MEMBERSHIPS = "memberships",
  REWARDS = "rewards",
  COUNTARCHIVE = "countarchive",
  COUNTLISTS = "countlists",
  COUNTLISTPRODUCTS = "countlistproducts",
  ACCOUNTING_EXPENSETYPE = "expensetype",
  ACCOUNTING_VENDOR = "vendor",
  ACCOUNTING_BRAND = "brand",
  ACCOUNTING_PRODUCT = "product",
  ACCOUNTING_PRODUCTCATEGORIES = "productcategories",
  ACCOUNTING_SERVICES = "services",
  ACCOUNTING_DISCOUNTS = "discounts",
  ACCOUNTING_PAYMENTMETHODS = "paymentmethods",
  ACCOUNTING_KITCHENS = "kitchens",
  ACCOUNTING_LOCATIONS = "locations",
  ACCOUNTING_UPPERCATEGORIES = "uppercategories",
  ACCOUNTING_ORDERNOTES = "ordernotes",
  ACCOUNTING_ACTIONS = "actions",
  MENU = "menu",
  MENU_CATEGORIES = "menu_categories",
  VISITS_VISITSCHEDULEOVERVIEW = "visits_visitscheduleoverview",
  VISITS_ALLVISITS = "visits_allvisits",
  VISITS_SHIFTS = "visits_shifts",
  CHECKLISTS_CHECKARCHIVE = "checklists_checkarchive",
  CHECKLISTS_CHECKLISTS = "checklists_checklists",
  EXPIRATIONS_COUNTARCHIVE = "expirations_countarchive",
  EXPIRATIONS_EXPIRATIONLISTS = "expirations_expirationlists",
  EXPIRATIONS_EXPIRATIONLISTPRODUCTS = "expirations_expirationlistproducts",
  CHECKOUT_INCOME = "checkout_income",
  CHECKOUT_EXPENSE = "checkout_expense",
  CHECKOUT_CASHOUT = "checkout_cashout",
  CHECKOUT_CHECKOUT_CONTROL = "checkout_checkout_control",
  MAILSUBSCRIPTIONS = "mailsubscriptions",
}

export enum ActionEnum {
  DELETE = "delete",
  ADD = "add",
  UPDATE = "update",
  TRANSFER = "transfer",
  EXCEL = "excel",
  SHOWPRICES = "show_prices",
  ENABLEEDIT = "enable_edit",
  SHOWTOTAL = "show_total",
  RATE = "rate",
  UPLOAD = "upload",
  SETBASEAMOUNT = "set_base_amount",
  UPDATEIKASSTOCK = "update_ikas_stock",
  UPDATESHOPIFYSTOCK = "update_shopify_stock",
  UPDATESTORESTOCK = "update_store_stock",
  SYNC = "sync",
  REFRESH = "refresh",
  REFUND = "refund",
  CANCEL = "cancel",
  SHOW_RECEIVED_ORDERS = "show_received_orders",
  SHOW_TABLES = "show_tables",
  HIDE_COMPLETED_RESERVATIONS = "hide_completed_reservations",
  GROUP_CAME = "group_came",
  CALLED = "called",
  OPENBACK = "openback",
  SHOW_INACTIVE_ELEMENTS = "show_inactive_elements",
  SHOW_COMPLETED_ACTIVITIES = "show_completed_activities",
  SHOW_EXPIRED_MEMBERSHIPS = "show_expired_memberships",
  SET_USED = "set_used",
  SET_UNUSED = "set_unused",
  SHOW_EXPIRED_OR_USED_REWARDS = "show_expired_or_used_rewards",
  TOGGLE = "toggle",
  UPDATE_LOCATION = "update_location",
  CREATE_COUNT = "create_count",
  ADD_TO_ELEMENT = "add_to_element",
  CREATE_MULTIPLE = "create_multiple",
  COMBINE_ELEMENTS = "combine_elements",
  ROLE_AUDIO_UPDATE = "role_audio_update",
  ACTIVATE_THE_SELECTION = "activate_the_selection",
  SHOW_BARCODE_INFO = "show_barcode_info",
  SHOW_DELETED_ELEMENTS = "show_deleted_elements",
  UPDATE_PRODUCT_SLUGS = "update_product_slugs",
  SHOW_ON_MENU = "show_on_menu",
  SHOW_IKAS_CATEGORIES = "show_ikas_categories",
  POPULARIZE = "popularize",
  ASSIGN_CHEF = "assign_chef",
  COPY_DAY_INTERVAL = "copy_day_interval",
  COPY_SHIFT = "copy_shift",
  CHECK = "check",
  SHOW_ALL = "show_all",
  NOTIFY = "notify",
}

export type Membership = {
  _id: number;
  name: string;
  startDate: string;
  endDate: string;
};

export type Reward = {
  _id: number;
  name: string;
  startDate: string;
  endDate: string;
  used: boolean;
};

export type MenuCategory = {
  _id: number;
  name: string;
  order: number;
  imageUrl: string;
  locations: number[];
  kitchen: string;
  isAutoServed: boolean;
  isOnlineOrder?: boolean;
  isKitchenMenu?: boolean;
  discounts?: number[];
  active: boolean;
  orderCategoryOrder: number;
  isLimitedTime?: boolean;
  showItemProductionOnMenu?: boolean;
  disableWhenOutOfStock?: boolean;
};

export type UpperCategory = {
  _id: number;
  name: string;
  categoryGroup: {
    category: number;
    percentage: number;
  }[];
};

export type MenuPopular = {
  _id: number;
  order: number;
  item: number;
};
export type Kitchen = {
  _id: string;
  name: string;
  isConfirmationRequired: boolean;
  locations: number[];
  soundRoles?: number[];
  selectedUsers?: string[];
};

export type MenuItem = {
  trendyolBarcode: unknown;
  hepsiBuradaSku?: unknown;
  _id: number;
  name: string;
  description: string;
  imageUrl: string;
  slug?: string;
  category: number;
  suggestedDiscount?: number[];
  order: number;
  isAutoServed?: boolean;
  isAutoPrepared?: boolean;
  itemProduction?: {
    product: string;
    quantity: number;
    isDecrementStock?: boolean;
  }[];
  price: number;
  onlinePrice?: number;
  locations: number[];
  priceHistory: {
    date: string;
    price: number;
  }[];
  matchedProduct?: string;
  productCategories?: string[];
  productImages?: string[];
  ikasId?: string;
  shopifyId?: string;
  shopifyVariantId?: string;
  sku?: string;
  barcode?: string;
  shownInMenu?: boolean;
  ikasDiscountedPrice?: number;
  createdAt?: Date;
  startDate?: string;
  endDate?: string;
  trendyolSku?: string;
};
export type ShiftValue = {
  shift: string;
  shiftEndHour?: string;
  user: string[];
  chefUser?: string;
};

export type Shift = {
  _id: number;
  day: string;
  location?: number;
  shifts: ShiftValue[];
};

export type CheckoutIncome = {
  _id: number;
  user: string;
  location: number;
  date: string;
  amount: number;
  createdAt?: Date;
  isAfterCount?: boolean;
};
export type CheckoutControl = {
  _id: number;
  user: string;
  location: number;
  date: string;
  amount: number;
  baseQuantity?: number;
  createdAt?: Date;
};

export type CheckoutCashout = {
  _id: number;
  user: string;
  location: number;
  date: string;
  amount: number;
  description: string;
  createdAt?: Date;
  isAfterCount?: boolean;
};
export type PanelControlPage = {
  _id: string;
  name: string;
  tabs?: {
    name: string;
    permissionRoles: number[];
  }[];
  permissionRoles: number[];
};
export type PanelSettings = {
  _id: number;
  isHoliday: boolean;
  isVisitEntryDisabled: boolean;
};

export type StyleDto = {
  color?: string;
  backgroundColor?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: string;
  imageHeight?: string;
  imageWidth?: string;
  imageBorderRadius?: string;
  imageMargin?: string;
};

export type EducationSubheaderDto = {
  componentType?: string;
  subHeader?: string;
  paragraph?: string;
  imageUrl?: string;
  style?: StyleDto;
  order: number;
};
export type EducationUpdateHistoryDto = {
  user: string;
  updatedAt: Date;
  updates?: string[];
};
export type Education = {
  _id: number;
  permissionRoles: number[];
  header: string;
  order: number;
  subheaders?: EducationSubheaderDto[];
  updateHistory?: EducationUpdateHistoryDto[];
  createdAt: Date;
  updatedAt: Date;
};
export type CafeActivity = {
  _id: number;
  date: string;
  location: number;
  hour: string;
  personCount: number;
  groupName: string;
  price?: number;
  complimentary?: string;
  contact: string;
  isCompleted?: boolean;
};
export type IkasCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: number;
};
export type ShopifyCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: number;
};
export type Order = {
  _id: number;
  location: number;
  item: number;
  table?: Table | number;
  quantity: number;
  status: string;
  note?: string;
  unitPrice: number;
  createdAt: Date;
  createdBy: string;
  confirmedAt?: Date;
  confirmedBy?: string;
  preparedAt?: Date;
  preparedBy?: string;
  deliveredAt?: Date;
  deliveredBy?: string;
  cancelledAt?: Date;
  cancelledBy?: string;
  paidQuantity: number;
  discount?: number;
  discountPercentage?: number;
  discountAmount?: number;
  division?: number;
  isOnlinePrice?: boolean;
  discountNote?: string | string[];
  stockLocation?: number;
  [key: string]: any;
  kitchen?: string;
  stockNote?: string;
  ikasId?: string;
  shopifyId?: string;
  paymentMethod?: string;
  tableDate?: Date;
  activityTableName?: string;
  activityPlayer?: string;
  isPaymentMade?: boolean;
  ikasCustomer?: IkasCustomer;
  isIkasCustomerPicked?: boolean;
  ikasOrderNumber?: string;
  shopifyCustomer?: ShopifyCustomer;
  isShopifyCustomerPicked?: boolean;
  shopifyOrderNumber?: string;
};

export type OrderCollection = {
  _id: number;
  location: number;
  createdAt: Date;
  createdBy: string;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancelNote?: string;
  amount: number;
  status: string;
  paymentMethod: string;
  pointUser?: string;
  pointConsumer?: number;
  orders?: OrderCollectionItem[];
  newOrders?: Order[];
  table?: Table | number;
  ikasId?: string;
  shopifyId?: string;
  tableDate?: Date;
  activityPlayer?: string;
  ikasOrderNumber?: string;
  shopifyOrderNumber?: string;
  shopifyShippingAmount?: number;
  shopifyDiscountAmount?: number;
};

export type OrderNote = {
  _id: number;
  note: string;
  categories?: number[];
  items?: number[];
};

export type OrderCollectionItem = {
  order: number;
  paidQuantity: number;
};

export type OrderDiscount = {
  _id: number;
  name: string;
  percentage?: number;
  amount?: number;
  isNoteRequired?: boolean;
  isOnlineOrder?: boolean;
  isStoreOrder?: boolean;
  isVisibleOnPaymentScreen?: boolean;
  status?: string;
  note?: string;
};
export enum OrderDiscountStatus {
  DELETED = "deleted",
}

export type Activity = {
  _id: number;
  user: User;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  payload: any;
};

export enum ReservationStatusEnum {
  WAITING = "Waiting",
  COMING = "Coming",
  NOT_COMING = "Not coming",
  NOT_RESPONDED = "Not responded",
  ALREADY_CAME = "Already came",
  CANCELLED = "Cancelled",
}

export type Reservation = {
  _id: number;
  location: number;
  createdBy: string;
  name: string;
  phone: string;
  playerCount: number;
  date: string;
  reservedTable: string;
  reservationHour: string;
  callHour: string;
  approvedHour?: string;
  callCount: number;
  finishHour: string;
  status: ReservationStatusEnum;
  order: number;
  note?: string;
  comingExpiresAt?: string;
};
export type Notification = {
  _id: number;
  createdAt: Date;
  message:
    | {
        key: string;
        params: Record<string, any>;
      }
    | string;
  type: string;
  event?: string;
  createdBy?: string;
  selectedUsers?: string[];
  selectedRoles?: number[];
  selectedLocations?: number[];
  seenBy?: string[];
  isAssigned?: boolean;
};

export enum NotificationType {
  INFORMATION = "INFORMATION",
  WARNING = "WARNING",
  ERROR = "ERROR",
  SUCCESS = "SUCCESS",
  ORDER = "ORDER",
}

export type TagType<T> = {
  _id: string | number;
  name: string;
} & T;

export enum RolePermissionEnum {
  OPERATION = "Operation",
  MANAGEMENT = "Management",
}

export enum UserGameUpdateType {
  ADD = "add",
  REMOVE = "remove",
}

export enum RowPerPageEnum {
  FIRST = 10,
  SECOND = 20,
  THIRD = 50,
  ALL = 10000000000,
}

export type IkasProduct = {
  id: string;
  name: string;
  description: null;
  shortDescription: null;
  weight: null;
  baseUnit: null;
  brandId: string;
  categoryIds: string[];
  googleTaxonomyId: null;
  salesChannelIds: string[];
  tagIds: string[];
  translations: any[];
  metaData: {
    id: string;
    canonicals: null;
    description: null;
    disableIndex: null;
    metadataOverrides: any[];
    pageTitle: null;
    slug: string;
    targetType: string;
    translations: any[];
  };
  productOptionSetId: null;
  productVariantTypes: any[];
  type: string;
  totalStock: null;
  variants: {
    id: string;
    attributes: null;
    stocks: {
      id: string;
      productId: string;
      stockCount: number;
      stockLocationId: string;
    }[];
    barcodeList: string[];
    fileId: null;
    hsCode: null;
    images: {
      fileName: null;
      imageId: string;
      isMain: boolean;
      isVideo: boolean;
      order: number;
    }[];
    isActive: boolean;
    prices: {
      currency: string | null;
      sellPrice: number;
      discountPrice: null;
      buyPrice: null;
      priceListId: string;
    }[];
    sku: null;
    unit: null;
    weight: null;
  }[];
};

export type ShopifyProduct = {
  id: string;
  title: string;
  description: string | null;
  body_html?: string | null;
  vendor: string;
  productType: string;
  product_type?: string;
  createdAt: string;
  created_at?: string;
  handle: string;
  updatedAt: string;
  updated_at?: string;
  published_at?: string | null;
  template_suffix?: string | null;
  status: string;
  published_scope?: string;
  tags: string;
  admin_graphql_api_id?: string;
  variants: {
    edges: {
      node: {
        id: string;
        product_id?: string;
        title: string;
        price: string;
        sku: string | null;
        position?: number;
        compare_at_price?: string | null;
        option1?: string | null;
        option2?: string | null;
        option3?: string | null;
        created_at?: string;
        updated_at?: string;
        taxable?: boolean;
        barcode: string | null;
        grams?: number;
        image_id?: string | null;
        weight?: number;
        weight_unit?: string;
        inventory_item_id?: string;
        inventoryQuantity: number;
        old_inventory_quantity?: number;
        requires_shipping?: boolean;
        admin_graphql_api_id?: string;
        image?: {
          url: string;
        };
        inventoryItem?: {
          id: string;
          tracked: boolean;
          inventoryLevels: {
            edges: {
              node: {
                id: string;
                quantities: {
                  name: string;
                  quantity: number;
                }[];
                location: {
                  id: string;
                  name: string;
                };
              };
            }[];
          };
        };
      };
    }[];
  };
  options?: {
    id: string;
    product_id: string;
    name: string;
    position: number;
    values: string[];
  }[];
  images: {
    edges: {
      node: {
        id: string;
        url: string;
        altText: string | null;
      };
    }[];
  };
};

export enum RoleEnum {
  MANAGER = 1,
  GAMEMASTER,
  GAMEMANAGER,
  OPERATIONSASISTANT,
  BARISTA,
  KITCHEN,
  SERVICE,
  CLEANING,
  KITCHEN2,
  KITCHEN3,
}

export enum RoleNameEnum {
  MANAGER = "Manager",
  GAMEMASTER = "Game Master",
  GAMEMANAGER = "Game Manager",
  OPERATIONALASISTANT = "Operations Assistant",
  BARISTA = "Barista",
  KITCHEN = "Kitchen",
  SERVICE = "Service",
  CLEANING = "Cleaning",
}
export enum ExpensesPageTabEnum {
  INVOICE,
  SERVICEINVOICE,
  ALLEXPENSES,
  VENDORPAYMENTS,
  ADDVENDORPAYMENT,
  BULKEXPENSECREATE,
}

export enum VisitPageTabEnum {
  DAILYVISIT,
  VISITCHART,
  VISITSCHEDULEOVERVIEW,
  ALLVISITS,
  SHIFTS,
  SHIFTCHANGE,
  CHANGEREQUESTMANAGEMENT,
  USERCHANGEREQUESTTAB,
  ALLBREAKS,
  ALLGAMEPLAYTIME,
}
export enum NotificationPageTabEnum {
  CREATENOTIFICATION,
  ALLNOTIFICATIONS,
  ASSIGNEDNOTIFICATIONS,
}
export enum CountListPageTabEnum {
  COUNTARCHIVE,
  COUNTLISTS,
  COUNTLISTPRODUCTS,
}
export enum ChecklistPageTabEnum {
  CHECKARCHIVE,
  CHECKLISTS,
}
export type DateQuantitiesType = {
  expirationDate: string;
  quantity: number;
};

export type ExpirationCountProductType = {
  product: string;
  dateQuantities: DateQuantitiesType[];
};

export type ExpirationCountType = {
  _id: string;
  user: string;
  location: number;
  expirationList: string;
  createdAt: Date;
  completedAt?: Date;
  isCompleted: boolean;
  products: ExpirationCountProductType[];
};
export enum ExpirationPageTabEnum {
  COUNTARCHIVE,
  EXPIRATIONLISTS,
  EXPIRATIONLISTPRODUCTS,
}
export enum PanelControlPageTabEnum {
  TASKTRACK,
  RELEASENOTES,
  PAGEPERMISSIONS,
  DISABLEDCONDITIONS,
  ROUTEAUTHORIZATIONPERMISSIONS,
  EDUCATIONPERMISSIONS,
  CHECKOUTCASH,
  PANELSETTINGS,
  USERACTIVITIES,
}
export enum PageDetailsPageTabEnum {
  PAGETABPERMISSIONS,
}
export enum AccountingPageTabEnum {
  EXPENSETYPE,
  VENDOR,
  BRAND,
  PRODUCT,
  // PRODUCTCATEGORIES,
  SHOPIFYCOLLECTIONS,
  SERVICES,
  DISCOUNTS,
  PAYMENTMETHODS,
  KITCHENS,
  LOCATIONS,
  UPPERCATEGORIES,
  ORDERNOTES,
  ROLES,
  ACTIONS,
}
export enum CheclistPageTabEnum {
  CHECKARCHIVE,
  CHECKLISTS,
}
export enum CheckoutPageTabEnum {
  INCOME,
  EXPENSE,
  CASHOUT,
  CHECKOUTCONTROL,
}
export enum StocksPageTabEnum {
  STOCK,
  GAMESTOCK,
  DESSERTSTOCK,
  COLDDRINKSTOCK,
  GAMESTOCKBYLOCATION,
  BASEQUANTITYBYLOCATION,
  PRODUCTSHELFINFO,
  VENDORORDER,
  ENTERCONSUMPTION,
  LOSSPRODUCT,
  PRODUCTSTOCKHISTORY,
}

export enum IntegrationPageTabEnum {
  SHOPIFYSTOCKCOMPARISION,
  SHOPIFYPRICECOMPARISION,
  TRENDYOLSTOCKCOMPARISION,
  HEPSIBURADAPRICECOMPARISION,
  HEPSIBURADASTOCKCOMPARISION,
  BACKINSTOCK,
  MAILSUBSCRIPTIONS,
  MAILLOGS,
}

export enum StockHistoriesReportsPageTabEnum {
  LOSSPRODUCTREPORT,
  ENTERCONSUMPTIONREPORT,
  PRODUCTSTOCKHISTORYREPORT,
}

export enum PointsPageTabEnum {
  USERSPOINT,
  CONSUMERSPOINT,
  USERSPOINTHISTORY,
  CONSUMERPOINTHISTORY,
}

export enum ConsumerPageTabEnum {
  CONSUMERS,
}

export enum GameplayAnalyticsTabEnum {
  GAMEPLAYBYGAMEMENTORS,
  UNIQUEGAMEPLAYBYGAMEMENTORS,
  TABLEPLAYERCOUNTS,
  GAMEPLAYSBYMENTORSDETAILS,
  GAMEPLAYSBYGAMES,
  KNOWNGAMESCOUNT,
  WHOKNOWS,
  LEARNEDGAMES,
}
export enum AccountingAnalyticsTabEnum {
  PRODUCTPRICECHART,
  MENUITEMPRICECHART,
}
export enum ProductPageTabEnum {
  PRODUCTPRICECHART,
  MENUITEMSWITHPRODUCT,
  PRODUCTEXPENSES,
  PRODUCTSTOCKHISTORY,
}
export enum LocationPageTabEnum {
  TABLENAMES,
  SHIFTS,
}
export enum VendorPageTabEnum {
  VENDORPRODUCTS,
  VENDORSERVICES,
  VENDOREXPENSES,
  VENDORPAYMENTS,
}
export enum BrandPageTabEnum {
  BRANDPRODUCTS,
  BRANDEXPENSES,
}
export enum ServicePageTabEnum {
  SERVICEEXPENSES,
}
export enum OrderDataTabEnum {
  DAILYINCOME,
  GROUPEDPRODUCTSALESREPORT,
  SINGLEPRODUCTSALESREPORT,
  UPPERCATEGORYBASEDSALESREPORT,
  CATEGORYBASEDSALESREPORT,
  DISCOUNTBASEDSALES,
  COLLECTIONS,
  ORDERS,
  IKASORDERS,
  SHOPIFYORDERS,
  TRENDYOLORDERS,
  HEPSIBURADAORDERS,
  PERSONALORDERDATAS,
}
export enum StockHistoryStatusEnum {
  EXPENSEENTRY = "EXPENSEENTRY",
  EXPENSEDELETE = "EXPENSEDELETE",
  EXPENSEUPDATEDELETE = "EXPENSEUPDATEDELETE",
  EXPENSEUPDATEENTRY = "EXPENSEUPDATEENTRY",
  EXPENSETRANSFER = "EXPENSETRANSFER",
  EXPENSEUPDATE = "EXPENSEUPDATE",
  STOCKDELETE = "STOCKDELETE",
  STOCKENTRY = "STOCKENTRY",
  STOCKUPDATE = "STOCKUPDATE",
  STOCKUPDATEDELETE = "STOCKUPDATEDELETE",
  STOCKUPDATEENTRY = "STOCKUPDATEENTRY",
  CONSUMPTION = "CONSUMPTION",
  TRANSFERSERVICETOINVOICE = "TRANSFERSERVICETOINVOICE",
  TRANSFERINVOICETOSERVICE = "TRANSFERINVOICETOSERVICE",
  ORDERCANCEL = "ORDERCANCEL",
  ORDERCREATE = "ORDERCREATE",
  STOCKEQUALIZE = "STOCKEQUALIZE",
  STOCKTRANSFER = "STOCKTRANSFER",
  LOSSPRODUCT = "LOSSPRODUCT",
  ORDERRETURN = "ORDERRETURN",
  IKASORDERCREATE = "IKASORDERCREATE",
  IKASORDERCANCEL = "IKASORDERCANCEL",
  SHOPIFYORDERCREATE = "SHOPIFYORDERCREATE",
  SHOPIFYORDERCANCEL = "SHOPIFYORDERCANCEL",
  TRENDYOLORDERCREATE = "TRENDYOLORDERCREATE",
  TRENDYOLORDERCANCEL = "TRENDYOLORDERCANCEL",
  LOSSPRODUCTCANCEL = "LOSSPRODUCTCANCEL",
  CONSUMPTIONCANCEL = "CONSUMPTIONCANCEL",
  HEPSIBURADAORDERCREATE = "HEPSIBURADAORDERCREATE",
  HEPSIBURADAORDERCANCEL = "HEPSIBURADAORDERCANCEL",
}

export const stockHistoryStatuses = [
  {
    value: StockHistoryStatusEnum.EXPENSEENTRY,
    label: "Expense Entry",
    backgroundColor: "bg-gray-500",
  },
  {
    value: StockHistoryStatusEnum.EXPENSEDELETE,
    label: "Expense Delete",
    backgroundColor: "bg-red-500",
  },
  {
    value: StockHistoryStatusEnum.EXPENSEUPDATEDELETE,
    label: "Expense Update Delete",
    backgroundColor: "bg-blue-500",
  },
  {
    value: StockHistoryStatusEnum.EXPENSEUPDATEENTRY,
    label: "Expense Update Entry",
    backgroundColor: "bg-green-500",
  },
  {
    value: StockHistoryStatusEnum.EXPENSETRANSFER,
    label: "Expense Transfer",
    backgroundColor: "bg-yellow-500",
  },
  {
    value: StockHistoryStatusEnum.EXPENSEUPDATE,
    label: "Expense Update",
    backgroundColor: "bg-teal-500",
  },
  {
    value: StockHistoryStatusEnum.STOCKDELETE,
    label: "Stock Delete",
    backgroundColor: "bg-purple-500",
  },
  {
    value: StockHistoryStatusEnum.STOCKENTRY,
    label: "Stock Entry",
    backgroundColor: "bg-pink-500",
  },
  {
    value: StockHistoryStatusEnum.STOCKUPDATE,
    label: "Stock Update",
    backgroundColor: "bg-orange-500",
  },
  {
    value: StockHistoryStatusEnum.STOCKUPDATEDELETE,
    label: "Stock Update Delete",
    backgroundColor: "bg-indigo-500",
  },
  {
    value: StockHistoryStatusEnum.STOCKUPDATEENTRY,
    label: "Stock Update Entry",
    backgroundColor: "bg-lime-500",
  },
  {
    value: StockHistoryStatusEnum.CONSUMPTION,
    label: "Consumption",
    backgroundColor: "bg-cyan-500",
  },
  {
    value: StockHistoryStatusEnum.TRANSFERSERVICETOINVOICE,
    label: "Transfer Service To Invoice",
    backgroundColor: "bg-amber-500",
  },
  {
    value: StockHistoryStatusEnum.TRANSFERINVOICETOSERVICE,
    label: "Transfer Invoice To Service",
    backgroundColor: "bg-rose-500",
  },
  {
    value: StockHistoryStatusEnum.ORDERCANCEL,
    label: "Order Cancel",
    backgroundColor: "bg-red-500",
  },
  {
    value: StockHistoryStatusEnum.ORDERCREATE,
    label: "Order Create",
    backgroundColor: "bg-green-500",
  },
  {
    value: StockHistoryStatusEnum.STOCKEQUALIZE,
    label: "Stock Equalize",
    backgroundColor: "bg-blue-500",
  },
  {
    value: StockHistoryStatusEnum.STOCKTRANSFER,
    label: "Stock Transfer",
    backgroundColor: "bg-yellow-800",
  },
  {
    value: StockHistoryStatusEnum.LOSSPRODUCT,
    label: "Loss Product",
    backgroundColor: "bg-red-800",
  },
  {
    value: StockHistoryStatusEnum.ORDERRETURN,
    label: "Order Return",
    backgroundColor: "bg-purple-800",
  },
  {
    value: StockHistoryStatusEnum.IKASORDERCREATE,
    label: "Ikas Order Create",
    backgroundColor: "bg-pink-800",
  },
  {
    value: StockHistoryStatusEnum.LOSSPRODUCTCANCEL,
    label: "Loss Product Cancel",
    backgroundColor: "bg-gray-800",
  },
  {
    value: StockHistoryStatusEnum.CONSUMPTIONCANCEL,
    label: "Consumption Cancel",
    backgroundColor: "bg-teal-800",
  },
  {
    value: StockHistoryStatusEnum.IKASORDERCANCEL,
    label: "Ikas Order Cancel",
    backgroundColor: "bg-orange-800",
  },
  {
    value: StockHistoryStatusEnum.SHOPIFYORDERCREATE,
    label: "Shopify Order Create",
    backgroundColor: "bg-indigo-800",
  },
  {
    value: StockHistoryStatusEnum.SHOPIFYORDERCANCEL,
    label: "Shopify Order Cancel",
    backgroundColor: "bg-cyan-800",
  },
  {
    value: StockHistoryStatusEnum.TRENDYOLORDERCREATE,
    label: "Trendyol Order Create",
    backgroundColor: "bg-amber-900",
  },
  {
    value: StockHistoryStatusEnum.TRENDYOLORDERCANCEL,
    label: "Trendyol Order Cancel",
    backgroundColor: "bg-amber-600",
  },
  {
    value: StockHistoryStatusEnum.HEPSIBURADAORDERCREATE,
    label: "Hepsiburada Order Create",
    backgroundColor: "bg-orange-600",
  },
  {
    value: StockHistoryStatusEnum.HEPSIBURADAORDERCANCEL,
    label: "Hepsiburada Order Cancel",
    backgroundColor: "bg-orange-900",
  },
];

export enum OrderStatus {
  CONFIRMATIONREQ = "confirmation_req",
  PENDING = "pending",
  READYTOSERVE = "ready_to_serve",
  SERVED = "served",
  CANCELLED = "cancelled",
  AUTOSERVED = "autoserved",
  WASTED = "wasted",
  RETURNED = "returned",
}
export enum TableTypes {
  NORMAL = "normal",
  TAKEOUT = "takeout",
  ONLINE = "online",
  ACTIVITY = "activity",
}
export enum OrderCollectionStatus {
  PAID = "paid",
  CANCELLED = "cancelled",
  RETURNED = "returned",
}
export enum TableStatus {
  CANCELLED = "cancelled",
}
export enum ConstantPaymentMethodsIds {
  CASH = "cash",
  CREDITCARD = "credit_card",
  BANKTRANSFER = "bank_transfer",
}

export const NOTPAID = "Not Paid";

export const TURKISHLIRA = "₺";
export const languageOptions = [
  { code: "en-EN", label: "EN" },
  { code: "tr-TR", label: "TR" },
];

export enum ActivityType {
  CHANGE_PASSWORD = "CHANGE_PASSWORD",
  CREATE_TABLE = "CREATE_TABLE",
  UPDATE_TABLE = "UPDATE_TABLE",
  DELETE_TABLE = "DELETE_TABLE",
  CREATE_GAMEPLAY = "CREATE_GAMEPLAY",
  UPDATE_GAMEPLAY = "UPDATE_GAMEPLAY",
  DELETE_GAMEPLAY = "DELETE_GAMEPLAY",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  CREATE_STOCK = "CREATE_STOCK",
  DELETE_STOCK = "DELETE_STOCK",
  UPDATE_STOCK = "UPDATE_STOCK",
  CREATE_EXPENSE = "CREATE_EXPENSE",
  DELETE_EXPENSE = "DELETE_EXPENSE",
  UPDATE_EXPENSE = "UPDATE_EXPENSE",
  CREATE_SERVICEEXPENSE = "CREATE_SERVICEEXPENSE",
  DELETE_SERVICEEXPENSE = "DELETE_SERVICEEXPENSE",
  UPDATE_SERVICEEXPENSE = "UPDATE_SERVICEEXPENSE",
  CREATE_EXPENSETYPE = "CREATE_EXPENSETYPE",
  DELETE_EXPENSETYPE = "DELETE_EXPENSETYPE",
  UPDATE_EXPENSETYPE = "UPDATE_EXPENSETYPE",
  CREATE_VENDOR = "CREATE_VENDOR",
  DELETE_VENDOR = "DELETE_VENDOR",
  UPDATE_VENDOR = "UPDATE_VENDOR",
  CREATE_BRAND = "CREATE_BRAND",
  DELETE_BRAND = "DELETE_BRAND",
  UPDATE_BRAND = "UPDATE_BRAND",
  CREATE_PAYMENTMETHOD = "CREATE_PAYMENTMETHOD",
  DELETE_PAYMENTMETHOD = "DELETE_PAYMENTMETHOD",
  UPDATE_PAYMENTMETHOD = "UPDATE_PAYMENTMETHOD",
  CREATE_ORDER = "CREATE_ORDER",
  ADD_ORDER = "ADD_ORDER",
  CANCEL_ORDER = "CANCEL_ORDER",
  PREPARE_ORDER = "PREPARE_ORDER",
  DELIVER_ORDER = "DELIVER_ORDER",
  TAKE_PAYMENT = "TAKE_PAYMENT",
  GAME_LEARNED_ADD = "GAME_LEARNED_ADD",
  GAME_LEARNED_REMOVE = "GAME_LEARNED_REMOVE",
  UPDATE_MENU_ITEM = "UPDATE_MENU_ITEM",
  ORDER_DISCOUNT = "ORDER_DISCOUNT",
  ORDER_DISCOUNT_CANCEL = "ORDER_DISCOUNT_CANCEL",
  CANCEL_PAYMENT = "CANCEL_PAYMENT",
  CREATE_RESERVATION = "CREATE_RESERVATION",
  UPDATE_RESERVATION = "UPDATE_RESERVATION",
  UPDATE_AUTHORIZATION = "UPDATE_AUTHORIZATION",
  UPDATE_ACCOUNT_PRODUCT = "UPDATE_ACCOUNT_PRODUCT",
  KITCHEN_ACTIVATED = "KITCHEN_ACTIVATED",
  KITCHEN_DEACTIVATED = "KITCHEN_DEACTIVATED",
  ORDER_DIVIDED = "ORDER_DIVIDED",
  DELETE_VISIT = "DELETE_VISIT",
  CREATE_VISIT = "CREATE_VISIT",
  FINISH_VISIT = "FINISH_VISIT",
  CLOSED_TABLE = "CLOSED_TABLE",
  REOPENED_TABLE = "REOPENED_TABLE",
  START_BREAK = "START_BREAK",
  FINISH_BREAK = "FINISH_BREAK",
  START_GAMEPLAY_TIME = "START_GAMEPLAY_TIME",
  FINISH_GAMEPLAY_TIME = "FINISH_GAMEPLAY_TIME",
  SHIFT_CHANGE_APPROVED = "SHIFT_CHANGE_APPROVED",
  SHIFT_CHANGE_REJECTED = "SHIFT_CHANGE_REJECTED",
}
export const activityTypeDetails = [
  {
    value: ActivityType.CHANGE_PASSWORD,
    label: "Change Password",
    bgColor: "bg-blue-500",
  },
  {
    value: ActivityType.CREATE_TABLE,
    label: "Create Table",
    bgColor: "bg-green-500",
  },
  {
    value: ActivityType.UPDATE_TABLE,
    label: "Update Table",
    bgColor: "bg-yellow-500",
  },
  {
    value: ActivityType.DELETE_TABLE,
    label: "Delete Table",
    bgColor: "bg-red-500",
  },
  {
    value: ActivityType.CLOSED_TABLE,
    label: "Closed Table",
    bgColor: "bg-orange-500",
  },
  {
    value: ActivityType.REOPENED_TABLE,
    label: "Reopened Table",
    bgColor: "bg-teal-500",
  },
  {
    value: ActivityType.CREATE_GAMEPLAY,
    label: "Create Gameplay",
    bgColor: "bg-green-500",
  },
  {
    value: ActivityType.UPDATE_GAMEPLAY,
    label: "Update Gameplay",
    bgColor: "bg-yellow-500",
  },
  {
    value: ActivityType.DELETE_GAMEPLAY,
    label: "Delete Gameplay",
    bgColor: "bg-red-500",
  },
  {
    value: ActivityType.LOGIN,
    label: "Login",
    bgColor: "bg-blue-500",
  },
  {
    value: ActivityType.LOGOUT,
    label: "Logout",
    bgColor: "bg-blue-500",
  },
  {
    value: ActivityType.CREATE_STOCK,
    label: "Create Stock",
    bgColor: "bg-green-500",
  },
  {
    value: ActivityType.DELETE_STOCK,
    label: "Delete Stock",
    bgColor: "bg-red-500",
  },
  {
    value: ActivityType.UPDATE_STOCK,
    label: "Update Stock",
    bgColor: "bg-yellow-500",
  },
  {
    value: ActivityType.CREATE_EXPENSE,
    label: "Create Expense",
    bgColor: "bg-green-500",
  },
  {
    value: ActivityType.DELETE_EXPENSE,
    label: "Delete Expense",
    bgColor: "bg-red-500",
  },
  {
    value: ActivityType.UPDATE_EXPENSE,
    label: "Update Expense",
    bgColor: "bg-yellow-500",
  },
  {
    value: ActivityType.CREATE_SERVICEEXPENSE,
    label: "Create Service Expense",
    bgColor: "bg-green-500",
  },
  {
    value: ActivityType.DELETE_SERVICEEXPENSE,
    label: "Delete Service Expense",
    bgColor: "bg-red-500",
  },
  {
    value: ActivityType.UPDATE_SERVICEEXPENSE,
    label: "Update Service Expense",
    bgColor: "bg-yellow-500",
  },
  {
    value: ActivityType.CREATE_EXPENSETYPE,
    label: "Create Expense Type",
    bgColor: "bg-green-500",
  },
  {
    value: ActivityType.DELETE_EXPENSETYPE,
    label: "Delete Expense Type",
    bgColor: "bg-red-500",
  },
  {
    value: ActivityType.UPDATE_EXPENSETYPE,
    label: "Update Expense Type",
    bgColor: "bg-yellow-500",
  },
  {
    value: ActivityType.CREATE_VENDOR,
    label: "Create Vendor",
    bgColor: "bg-green-500",
  },
  {
    value: ActivityType.DELETE_VENDOR,
    label: "Delete Vendor",
    bgColor: "bg-red-500",
  },
  {
    value: ActivityType.UPDATE_VENDOR,
    label: "Update Vendor",
    bgColor: "bg-yellow-500",
  },
  {
    value: ActivityType.CREATE_BRAND,
    label: "Create Brand",
    bgColor: "bg-green-500",
  },
  {
    value: ActivityType.DELETE_BRAND,
    label: "Delete Brand",
    bgColor: "bg-red-500",
  },
  {
    value: ActivityType.UPDATE_BRAND,
    label: "Update Brand",
    bgColor: "bg-yellow-500",
  },
  {
    value: ActivityType.CREATE_PAYMENTMETHOD,
    label: "Create Payment Method",
    bgColor: "bg-green-500",
  },
  {
    value: ActivityType.DELETE_PAYMENTMETHOD,
    label: "Delete Payment Method",
    bgColor: "bg-red-500",
  },
  {
    value: ActivityType.UPDATE_PAYMENTMETHOD,
    label: "Update Payment Method",
    bgColor: "bg-yellow-500",
  },
  {
    value: ActivityType.CREATE_ORDER,
    label: "Create Order",
    bgColor: "bg-green-500",
  },
  {
    value: ActivityType.ADD_ORDER,
    label: "Add Order",
    bgColor: "bg-blue-500",
  },
  {
    value: ActivityType.CANCEL_ORDER,
    label: "Cancel Order",
    bgColor: "bg-red-500",
  },
  {
    value: ActivityType.PREPARE_ORDER,
    label: "Prepare Order",
    bgColor: "bg-yellow-500",
  },
  {
    value: ActivityType.DELIVER_ORDER,
    label: "Deliver Order",
    bgColor: "bg-purple-500",
  },
  {
    value: ActivityType.TAKE_PAYMENT,
    label: "Take Payment",
    bgColor: "bg-indigo-500",
  },
  {
    value: ActivityType.GAME_LEARNED_ADD,
    label: "Add Learned Game",
    bgColor: "bg-teal-500",
  },
  {
    value: ActivityType.GAME_LEARNED_REMOVE,
    label: "Remove Learned Game",
    bgColor: "bg-orange-500",
  },
  {
    value: ActivityType.UPDATE_MENU_ITEM,
    label: "Update Menu Item",
    bgColor: "bg-purple-200",
  },
  {
    value: ActivityType.ORDER_DISCOUNT,
    label: "Order Discount",
    bgColor: "bg-green-900",
  },
  {
    value: ActivityType.ORDER_DISCOUNT_CANCEL,
    label: "Order Discount Cancel",
    bgColor: "bg-red-900",
  },
  {
    value: ActivityType.CANCEL_PAYMENT,
    label: "Cancel Payment",
    bgColor: "bg-red-900",
  },
  {
    value: ActivityType.CREATE_RESERVATION,
    label: "Create Reservation",
    bgColor: "bg-green-500",
  },
  {
    value: ActivityType.UPDATE_RESERVATION,
    label: "Update Reservation",
    bgColor: "bg-yellow-700",
  },
  {
    value: ActivityType.UPDATE_AUTHORIZATION,
    label: "Update Authorization",
    bgColor: "bg-yellow-900",
  },
  {
    value: ActivityType.UPDATE_ACCOUNT_PRODUCT,
    label: "Update Account Product",
    bgColor: "bg-purple-900",
  },
  {
    value: ActivityType.KITCHEN_ACTIVATED,
    label: "Kitchen Activated",
    bgColor: "bg-green-700",
  },
  {
    value: ActivityType.KITCHEN_DEACTIVATED,
    label: "Kitchen Deactivated",
    bgColor: "bg-red-700",
  },
  {
    value: ActivityType.ORDER_DIVIDED,
    label: "Order Divided",
    bgColor: "bg-purple-500",
  },
  {
    value: ActivityType.DELETE_VISIT,
    label: "Delete Visit",
    bgColor: "bg-red-500",
  },
  {
    value: ActivityType.CREATE_VISIT,
    label: "Visit Entry",
    bgColor: "bg-green-500",
  },
  {
    value: ActivityType.FINISH_VISIT,
    label: "Visit Exit",
    bgColor: "bg-blue-500",
  },
  {
    value: ActivityType.START_BREAK,
    label: "Start Break",
    bgColor: "bg-green-500",
  },
  {
    value: ActivityType.FINISH_BREAK,
    label: "Finish Break",
    bgColor: "bg-red-500",
  },
  {
    value: ActivityType.START_GAMEPLAY_TIME,
    label: "Start Gameplay Time",
    bgColor: "bg-green-500",
  },
  {
    value: ActivityType.FINISH_GAMEPLAY_TIME,
    label: "Finish Gameplay Time",
    bgColor: "bg-red-500",
  },
  {
    value: ActivityType.SHIFT_CHANGE_APPROVED,
    label: "Shift Change Approved",
    bgColor: "bg-green-600",
  },
  {
    value: ActivityType.SHIFT_CHANGE_REJECTED,
    label: "Shift Change Rejected",
    bgColor: "bg-red-600",
  },
];

export interface SocketEventType {
  event: string;
  invalidateKeys: string[];
}
export const commonDateOptions = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "thisWeek", label: "This Week" },
  { value: "lastWeek", label: "Last Week" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "twoMonthsAgo", label: "Two Months Ago" },
  { value: "sameDayLastMonthToToday", label: "Same day Last Month" },
  { value: "thisYear", label: "This Year" },
  { value: "lastYear", label: "Last Year" },
  { value: "nextWeek", label: "Next Week" },
  { value: "nextMonth", label: "Next Month" },
  {
    value: "fromTodayToEndOfNextMonth",
    label: "From Today To End Of Next Month",
  },
  { value: "last7Days", label: "Last 7 Days" },
  { value: "last30Days", label: "Last 30 Days" },
  { value: "last3Months", label: "Last 3 Months" },
  { value: "last6Months", label: "Last 6 Months" },
  { value: "customDate", label: "Custom Date" },
];

export type DateRangeKey =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "twoMonthsAgo"
  | "sameDayLastMonthToToday"
  | "thisYear"
  | "lastYear"
  | "nextWeek"
  | "nextMonth"
  | "fromTodayToEndOfNextMonth"
  | "last7Days"
  | "last30Days"
  | "last3Months"
  | "last6Months"
  | "customDate";

export type Granularity = "daily" | "monthly";

export type DailyData = {
  date: string;
  total: number;
};

export type WeeklyData = {
  weekStart: string;
  weekEnd: string;
  total: number;
};

export type MonthlyData = {
  month: string;
  total: number;
};

export type PeriodData<T = DailyData | WeeklyData | MonthlyData> = {
  granularity: Granularity;
  startDate: string;
  endDate: string;
  data: T[];
  totalRevenue: number;
};

export type ComparisonMetrics = {
  percentageChange: number;
  absoluteChange: number;
};

export type CategorySummaryCompareResponse = {
  primaryPeriod: PeriodData;
  secondaryPeriod: PeriodData;
  comparisonMetrics: ComparisonMetrics;
};

export type PersonalOrderDataType = {
  _id: string;
  user: string;
  createdByCount: number;
  preparedByCount: number;
  cancelledByCount: number;
  deliveredByCount: number;
  createdByTableCount: number;
  preparedByTableCount: number;
  cancelledByTableCount: number;
  deliveredByTableCount: number;
  createdByTables: number[];
  preparedByTables: number[];
  cancelledByTables: number[];
  deliveredByTables: number[];
};
export type FormElementsState = {
  [key: string]: any;
};
export enum ExpenseTypes {
  STOCKABLE = "STOCKABLE",
  NONSTOCKABLE = "NONSTOCKABLE",
}

export const orderFilterStatusOptions = [
  { value: OrderStatus.PENDING, label: "Pending" },
  { value: OrderStatus.READYTOSERVE, label: "Ready to Serve" },
  { value: OrderStatus.SERVED, label: "Served" },
  { value: OrderStatus.CANCELLED, label: "Cancelled" },
  { value: OrderStatus.AUTOSERVED, label: "Auto served" },
  { value: OrderStatus.WASTED, label: "Loss Product" },
  { value: OrderStatus.RETURNED, label: "Returned" },
];
// Event Type'a göre modern renk şeması - Her event farklı renk
export const NotificationEventColors: Record<
  string,
  { gradient: string; solid: string }
> = {
  // 🔴 KRİTİK UYARILAR - Kırmızı Tonları
  NIGHTOPENTABLE: {
    gradient: "linear-gradient(135deg, #E53E3E 0%, #C53030 100%)", // Bright Red
    solid: "#E53E3E",
  },
  NEGATIVESTOCK: {
    gradient: "linear-gradient(135deg, #F56565 0%, #E53E3E 100%)", // Rose Red
    solid: "#F56565",
  },
  ZEROSTOCK: {
    gradient: "linear-gradient(135deg, #FC8181 0%, #F56565 100%)", // Light Red
    solid: "#FC8181",
  },
  LOSSPRODUCT: {
    gradient: "linear-gradient(135deg, #F85F73 0%, #C51E3A 100%)", // Deep Rose
    solid: "#F85F73",
  },

  // 🟠 VARDIYA SORUNLARI - Turuncu Tonları
  LATESHIFTSTART: {
    gradient: "linear-gradient(135deg, #ED8936 0%, #DD6B20 100%)", // Orange
    solid: "#ED8936",
  },
  EARLYSHIFTEND: {
    gradient: "linear-gradient(135deg, #F6AD55 0%, #ED8936 100%)", // Light Orange
    solid: "#F6AD55",
  },
  UNFINISHEDVISIT: {
    gradient: "linear-gradient(135deg, #FB923C 0%, #F97316 100%)", // Amber Orange
    solid: "#FB923C",
  },

  // 🟡 EKSİK İŞLEMLER - Sarı/Amber Tonları
  UNCOMPLETEDCHECKLIST: {
    gradient: "linear-gradient(135deg, #F6E05E 0%, #ECC94B 100%)", // Golden Yellow
    solid: "#F6E05E",
  },

  // 🟢 BAŞARILI İŞLEMLER - Yeşil Tonları
  COMPLETECOUNT: {
    gradient: "linear-gradient(135deg, #48BB78 0%, #38A169 100%)", // Green
    solid: "#48BB78",
  },
  STOCKRESTORED: {
    gradient: "linear-gradient(135deg, #68D391 0%, #48BB78 100%)", // Light Green
    solid: "#68D391",
  },

  // 🔵 BİLGİLENDİRME - Mavi/Turkuaz Tonları
  IKASTAKEAWAY: {
    gradient: "linear-gradient(135deg, #4299E1 0%, #3182CE 100%)", // Blue
    solid: "#4299E1",
  },
};

// Fallback: Type'a göre modern renk şeması (event yoksa kullanılır)
export const NotificationBackgroundColors: Record<NotificationType, string> = {
  [NotificationType.INFORMATION]:
    "linear-gradient(135deg, #4299E1 0%, #3182CE 100%)", // Blue (bilgilendirme ile uyumlu)
  [NotificationType.WARNING]:
    "linear-gradient(135deg, #ED8936 0%, #DD6B20 100%)", // Orange (vardiya sorunları ile uyumlu)
  [NotificationType.ERROR]: "linear-gradient(135deg, #E53E3E 0%, #C53030 100%)", // Bright Red (kritik uyarılar ile uyumlu)
  [NotificationType.SUCCESS]:
    "linear-gradient(135deg, #48BB78 0%, #38A169 100%)", // Green (başarılı işlemler ile uyumlu)
  [NotificationType.ORDER]: "linear-gradient(135deg, #9D84B7 0%, #6B5B95 100%)", // Royal Purple
};

export const NotificationColors: Record<NotificationType, string> = {
  [NotificationType.INFORMATION]: "#4299E1",
  [NotificationType.WARNING]: "#ED8936",
  [NotificationType.ERROR]: "#E53E3E",
  [NotificationType.SUCCESS]: "#48BB78",
  [NotificationType.ORDER]: "#9D84B7",
};

export enum NotificationEventType {
  COMPLETECOUNT = "COMPLETECOUNT",
  NEGATIVESTOCK = "NEGATIVESTOCK",
  ZEROSTOCK = "ZEROSTOCK",
  STOCKRESTORED = "STOCKRESTORED",
  LOSSPRODUCT = "LOSSPRODUCT",
  IKASTAKEAWAY = "IKASTAKEAWAY",
  LATESHIFTSTART = "LATESHIFTSTART",
  NIGHTOPENTABLE = "NIGHTOPENTABLE",
  EARLYSHIFTEND = "EARLYSHIFTEND",
  UNCOMPLETEDCHECKLIST = "UNCOMPLETEDCHECKLIST",
  KITCHENACTIVATED = "KITCHENACTIVATED",
  KITCHENDEACTIVATED = "KITCHENDEACTIVATED",
  KITCHENNOTCONFIRMED = "KITCHENNOTCONFIRMED",
  UNFINISHEDVISIT = "UNFINISHEDVISIT",
  SHIFTCHANGEREQUESTED = "SHIFTCHANGEREQUESTED",
  SHIFTCHANGEAPPROVED = "SHIFTCHANGEAPPROVED",
  SHIFTCHANGEREJECTED = "SHIFTCHANGEREJECTED",
  SHOPIFYTAKEAWAY = "SHOPIFYTAKEAWAY",
  SHOPIFYORDER = "SHOPIFYORDER",
}
export const notificationEventsOptions = [
  {
    value: NotificationEventType.COMPLETECOUNT,
    label: "Complete Count",
  },
  {
    value: NotificationEventType.NEGATIVESTOCK,
    label: "Negative Stock",
  },
  {
    value: NotificationEventType.ZEROSTOCK,
    label: "Zero Stock",
  },
  {
    value: NotificationEventType.STOCKRESTORED,
    label: "Stock Restored",
  },
  {
    value: NotificationEventType.LOSSPRODUCT,
    label: "Loss Product",
  },
  {
    value: NotificationEventType.IKASTAKEAWAY,
    label: "Ikas Takeaway",
  },
  {
    value: NotificationEventType.LATESHIFTSTART,
    label: "Late Shift Start",
  },
  {
    value: NotificationEventType.NIGHTOPENTABLE,
    label: "Night Open Table",
  },
  {
    value: NotificationEventType.EARLYSHIFTEND,
    label: "Early Shift End",
  },
  {
    value: NotificationEventType.UNCOMPLETEDCHECKLIST,
    label: "Uncompleted Checklist",
  },
  {
    value: NotificationEventType.KITCHENACTIVATED,
    label: "Kitchen Activated",
  },
  {
    value: NotificationEventType.KITCHENDEACTIVATED,
    label: "Kitchen Deactivated",
  },
  {
    value: NotificationEventType.KITCHENNOTCONFIRMED,
    label: "Kitchen Not Confirmed",
  },
  {
    value: NotificationEventType.UNFINISHEDVISIT,
    label: "Unfinished Visit",
  },
  {
    value: NotificationEventType.SHIFTCHANGEREQUESTED,
    label: NotificationEventType.SHIFTCHANGEREQUESTED,
  },
  {
    value: NotificationEventType.SHIFTCHANGEAPPROVED,
    label: NotificationEventType.SHIFTCHANGEAPPROVED,
  },
  {
    value: NotificationEventType.SHIFTCHANGEREJECTED,
    label: NotificationEventType.SHIFTCHANGEREJECTED,
  },
  {
    value: NotificationEventType.SHOPIFYTAKEAWAY,
    label: "Shopify Takeaway",
  },
  {
    value: NotificationEventType.SHOPIFYORDER,
    label: "Shopify Order",
  },
];

export type PopularDiscounts = {
  item: number;
  discounts: number[];
};

export const GAMEEXPENSETYPE = "oys";
export const DESSERTEXPENSETYPE = "tat";
export const SANDWICHEXPENSETYPE = "sand";
export const COLDDRINKEXPENSETYPE = "soguk_icecekler";
export type OptionType = { value: any; label: string; imageUrl?: string };

// -------------------- Shift Change (Requests) --------------------
export enum ShiftChangeStatusEnum {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum ShiftChangeTypeEnum {
  SWAP = "SWAP",
  TRANSFER = "TRANSFER",
}

export type ShiftSnapshot = {
  shiftId: number;
  day: string;
  startTime: string;
  endTime?: string;
  location?: number;
  chefUser?: string;
  userId: string;
};

export type ShiftChangeRequestType = {
  _id: number;
  requesterId: string | { _id: string; name: string; fullName?: string };
  targetUserId: string | { _id: string; name: string; fullName?: string };
  requesterShift: ShiftSnapshot;
  targetShift: ShiftSnapshot;
  type: ShiftChangeTypeEnum;
  requesterNote: string;
  managerNote?: string;
  status: ShiftChangeStatusEnum;
  managerApprovalStatus: "PENDING" | "APPROVED" | "REJECTED";
  managerApprovedBy?: string;
  managerApprovedAt?: string;
  targetUserApprovalStatus: "PENDING" | "APPROVED" | "REJECTED";
  targetUserApprovedAt?: string;
  processedByManagerId?: string;
  processedAt?: string;
  createdAt?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export const OnlineLocationId = 4; //TODO: bu moduler yapiya uygun degil

export type WebhookLog = {
  _id: number;
  source: string;
  endpoint: string;
  requestBody?: any;
  status: string;
  orderIds?: number[];
  createdAt: string | Date;
  updatedAt?: string | Date;
  errorMessage?: string;
  externalOrderId?: string;
  processedAt?: string | Date;
  processingTimeMs?: number;
  responseBody?: any;
  statusCode?: number;
};
