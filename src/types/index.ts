export type Gameplay = {
  _id: number;
  date: string;
  startHour: string;
  finishHour?: string;
  playerCount: number;
  game?: Game | number;
  mentor: User;
  location: number;
  createdBy: User;
};
export type Authorization = {
  _id: number;
  path: string;
  method: string;
  roles: number[];
  relatedPages?: string[];
};

export type Location = {
  _id: number;
  name: string;
  tableCount?: number;
  type: number[];
  active: boolean;
  activityNote?: string;
  ikasId?: string;
  shifts?: {
    shift: string;
    isActive: boolean;
    type: string;
  }[];
  tableNames?: string[];
  closedDays?: string[];
  isShelfInfoRequired?: boolean;
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
  location?: number;
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
export type AccountCount = {
  _id: string;
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
  location: number;
  user: string;
  products?: {
    product: string;
    stockQuantity: number;
    countQuantity: number;
    isStockEqualized?: boolean;
    productDeleteRequest?: string;
  }[];
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
};

export type ProductCategories = {
  _id: string;
  name: string;
  ikasId?: string;
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
  kdv?: number;
  service: string;
  type: string;
  paymentMethod: string;
};

export type AccountInvoice = {
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
  kdv?: number;
  paymentMethod: string;
  isPaid: boolean;
  isStockIncrement?: boolean;
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
  kdv?: number;
  paymentMethod: string;
  isPaid: boolean;
  isStockIncrement?: boolean;
};

export type AccountServiceInvoice = {
  _id: number;
  service: string;
  expenseType: string;
  quantity: number;
  totalExpense: number;
  date: string;
  vendor?: string;
  note?: string;
  location: number;
  price?: number;
  kdv?: number;
  paymentMethod: string;
  isPaid: boolean;
  user: string;
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

export type Visit = {
  _id: number;
  location: number;
  date: string;
  user: string;
  startHour: string;
  finishHour?: string;
};

export type ButtonCall = {
  _id: string;
  tableName: string;
  location: number;
  locationName?: string;
  date: string;
  startHour: string;
  finishHour?: string;
  createdBy: string;
  cancelledBy?: string;
  cancelledByName?: string;
  duration?: number;
  callCount: number;
};

export enum ButtonCallType {
  ACTIVE = "active",
  CLOSED = "closed",
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
  discounts?: number[];
  active: boolean;
  orderCategoryOrder: number;
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
  soundRoles: number[];
};

export type MenuItem = {
  _id: number;
  name: string;
  description: string;
  imageUrl: string;
  slug?: string;
  category: number;
  order: number;
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
  shownInMenu?: boolean;
  ikasDiscountedPrice?: number;
};
export type ShiftValue = {
  shift: string;
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
};
export type CheckoutControl = {
  _id: number;
  user: string;
  location: number;
  date: string;
  amount: number;
};

export type CheckoutCashout = {
  _id: number;
  user: string;
  location: number;
  date: string;
  amount: number;
  description: string;
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
};
export type PanelControlCheckoutCash = {
  _id: number;
  description?: string;
  amount: number;
  date: string;
  user: User;
  location: number;
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
  discountNote?: string;
  stockLocation?: number;
  [key: string]: any;
  kitchen?: string;
  stockNote?: string;
  ikasId?: string;
  paymentMethod?: string;
  tableDate?: Date;
  activityTableName?: string;
  activityPlayer?: string;
  isPaymentMade?: boolean;
  ikasCustomer?: IkasCustomer;
  isIkasCustomerPicked?: boolean;
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
  orders?: OrderCollectionItem[];
  newOrders?: Order[];
  table?: Table | number;
  ikasId?: string;
  tableDate?: Date;
  activityPlayer?: string;
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
}

export type Reservation = {
  _id: number;
  location: number;
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
};
export type Notification = {
  _id: number;
  createdAt: Date;
  message?: string;
  type: string;
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
    }[];
    sku: null;
    unit: null;
    weight: null;
  }[];
};

export enum RoleEnum {
  MANAGER = 1,
  GAMEMASTER,
  GAMEMANAGER,
  CATERINGMANAGER,
  BARISTA,
  KITCHEN,
  SERVICE,
  CLEANING,
  KITCHEN2,
}

export enum RoleNameEnum {
  MANAGER = "Manager",
  GAMEMASTER = "Game Master",
  GAMEMANAGER = "Game Manager",
  CATERINGMANAGER = "Catering Manager",
  BARISTA = "Barista",
  KITCHEN = "Kitchen",
  SERVICE = "Service",
  CLEANING = "Cleaning",
}
export enum ExpensesPageTabEnum {
  INVOICE,
  SERVICEINVOICE,
  ALLEXPENSES,
  ADDVENDORPAYMENT,
  BULKEXPENSECREATE,
}

export enum VisitPageTabEnum {
  DAILYVISIT,
  VISITCHART,
  VISITSCHEDULEOVERVIEW,
  ALLVISITS,
  SHIFTS,
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
  PAGEPERMISSIONS,
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
  PRODUCTCATEGORIES,
  SERVICES,
  DISCOUNTS,
  PAYMENTMETHODS,
  KITCHENS,
  LOCATIONS,
  UPPERCATEGORIES,
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
  GAMESTOCKBYLOCATION,
  BASEQUANTITYBYLOCATION,
  PRODUCTSHELFINFO,
  VENDORORDER,
  IKASSTOCKCOMPARISION,
  ENTERCONSUMPTION,
  LOSSPRODUCT,
  PRODUCTSTOCKHISTORY,
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
  FARMBURGER,
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
  LOSSPRODUCTCANCEL = "LOSSPRODUCTCANCEL",
  CONSUMPTIONCANCEL = "CONSUMPTIONCANCEL",
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
  FARM_BURGER_ACTIVATED = "FARM_BURGER_ACTIVATED",
  FARM_BURGER_DEACTIVATED = "FARM_BURGER_DEACTIVATED",
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
    value: ActivityType.FARM_BURGER_ACTIVATED,
    label: "Farm Burger Activated",
    bgColor: "bg-green-800",
  },
  {
    value: ActivityType.FARM_BURGER_DEACTIVATED,
    label: "Farm Burger Deactivated",
    bgColor: "bg-red-800",
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
  | "lastYear";

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
export const NotificationBackgroundColors: Record<NotificationType, string> = {
  [NotificationType.INFORMATION]: "#79a8ce",
  [NotificationType.WARNING]: "#e8c185",
  [NotificationType.ERROR]: "#e56d64",
  [NotificationType.SUCCESS]: "#92e895",
  [NotificationType.ORDER]: "#de8dec",
};

export enum NotificationEventType {
  COMPLETECOUNT = "COMPLETECOUNT",
  NEGATIVESTOCK = "NEGATIVESTOCK",
  ZEROSTOCK = "ZEROSTOCK",
  LOSSPRODUCT = "LOSSPRODUCT",
  IKASTAKEAWAY = "IKASTAKEAWAY",
  LATESHIFTSTART = "LATESHIFTSTART",
  FARMBURGERACTIVATED = "FARMBURGERACTIVATED",
  FARMBURGERDEACTIVATED = "FARMBURGERDEACTIVATED",
  FARMNOTCONFIRMED = "FARMNOTCONFIRMED",
  NIGHTOPENTABLE = "NIGHTOPENTABLE",
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
    value: NotificationEventType.FARMBURGERACTIVATED,
    label: "Farm Burger Activated",
  },
  {
    value: NotificationEventType.FARMBURGERDEACTIVATED,
    label: "Farm Burger Deactivated",
  },
  {
    value: NotificationEventType.FARMNOTCONFIRMED,
    label: "Farm Not Confirmed",
  },
  {
    value: NotificationEventType.NIGHTOPENTABLE,
    label: "Night Open Table",
  },
];

export type PopularDiscounts = {
  item: number;
  discounts: number[];
};

export const GAMEEXPENSETYPE = "oys";
export const DESSERTEXPENSETYPE = "tat";
export const FARMBURGERCATEGORYID = 30;
export type OptionType = { value: any; label: string; imageUrl?: string };
