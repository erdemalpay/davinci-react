export type Gameplay = {
  _id: number;
  date: string;
  startHour: string;
  finishHour?: string;
  playerCount: number;
  game?: Game | number;
  mentor: User;
  location: number;
};

export type Location = {
  _id: number;
  name: string;
};

export type Table = {
  _id: number;
  name: string;
  date: string;
  playerCount: number;
  location?: number;
  startHour: string;
  finishHour?: string;
  orders?: number[];
  gameplays: Gameplay[];
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
  userGames: [
    {
      game: number;
      learnDate: string;
    }
  ];
};

export type Game = {
  _id: number;
  name: string;
  image: string;
  thumbnail: string;
  expansion: boolean;
  locations: number[];
};
export type AccountProduct = {
  _id: string;
  name: string;
  unit: AccountUnit | string;
  expenseType: string[];
  vendor?: string[];
  brand?: string[];
  unitPrice: number;
  packages?: {
    package: string;
    packageUnitPrice: number;
  }[];
};
export type AccountFixture = {
  _id: string;
  name: string;
  expenseType: string[];
  vendor?: string[];
  brand?: string[];
  unitPrice: number;
};
export type AccountService = {
  _id: string;
  name: string;
  expenseType: string[];
  vendor?: string[];
  unitPrice: number;
};
export type AccountUnit = {
  _id: string;
  name: string;
};

export type AccountCountList = {
  _id: string;
  name: string;
  locations: string[];
  products?: {
    product: string;
    locations: string[];
  }[];
};
export type AccountFixtureCountList = {
  _id: string;
  name: string;
  locations: string[];
  fixtures?: {
    fixture: string;
    locations: string[];
  }[];
};
export type AccountCount = {
  _id: string;
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
  location: string | AccountStockLocation;
  user: string | User;
  products?: {
    product: string;
    packageType: string;
    stockQuantity: number;
    countQuantity: number;
  }[];
  countList: string | AccountCountList;
};
export type AccountFixtureCount = {
  _id: string;
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
  location: string | AccountStockLocation;
  user: string | User;
  fixtures?: {
    fixture: string;
    stockQuantity: number;
    countQuantity: number;
  }[];
  countList: string | AccountFixtureCountList;
};
export type AccountExpenseType = {
  _id: string;
  name: string;
  backgroundColor: string;
};

export type AccountPackageType = {
  _id: string;
  name: string;
  quantity: number;
  unit: AccountUnit | string;
};
export type AccountBrand = {
  _id: string;
  name: string;
};
export type AccountVendor = {
  _id: string;
  name: string;
};

export type AccountStockLocation = {
  _id: string;
  name: string;
};
export type AccountPaymentMethod = {
  _id: string;
  name: string;
  isConstant: boolean;
};
export type AccountPayment = {
  _id: number;
  vendor: AccountVendor;
  invoice?: number;
  fixtureInvoice?: number;
  serviceInvoice?: number;
  paymentMethod: AccountPaymentMethod | string;
  location: string | AccountStockLocation;
  user: User;
  date: string;
  amount: number;
};
export type AccountOverallExpense = {
  _id: number;
  product: AccountProduct | string;
  expenseType: AccountExpenseType | string;
  quantity: number;
  totalExpense: number;
  date: string;
  brand?: AccountBrand | string;
  vendor?: AccountVendor | string;
  packageType?: AccountPackageType | string;
  note?: string;
  location: string | AccountStockLocation;
  price?: number;
  kdv?: number;
  fixture: AccountFixture | string;
  service: AccountService | string;
  type: string;
  paymentMethod: AccountPaymentMethod | string;
};

export type AccountInvoice = {
  _id: number;
  product: AccountProduct | string;
  expenseType: AccountExpenseType | string;
  quantity: number;
  totalExpense: number;
  date: string;
  brand?: AccountBrand | string;
  vendor?: AccountVendor | string;
  packageType?: AccountPackageType | string;
  note?: string;
  location: string | AccountStockLocation;
  price?: number;
  kdv?: number;
  paymentMethod: AccountPaymentMethod | string;
  isPaid: boolean;
};
export type AccountFixtureInvoice = {
  _id: number;
  fixture: AccountFixture | string;
  expenseType: AccountExpenseType | string;
  quantity: number;
  totalExpense: number;
  date: string;
  brand?: AccountBrand | string;
  vendor?: AccountVendor | string;
  note?: string;
  location: string | AccountStockLocation;
  price?: number;
  kdv?: number;
  paymentMethod: AccountPaymentMethod | string;
  isPaid: boolean;
};

export type AccountServiceInvoice = {
  _id: number;
  service: AccountService | string;
  expenseType: AccountExpenseType | string;
  quantity: number;
  totalExpense: number;
  date: string;
  vendor?: AccountVendor | string;
  note?: string;
  location: string | AccountStockLocation;
  price?: number;
  kdv?: number;
  paymentMethod: AccountPaymentMethod | string;
  isPaid: boolean;
};

export type AccountStock = {
  _id: string;
  product: AccountProduct | string;
  location: string | AccountStockLocation;
  quantity: number;
  packageType?: AccountPackageType | string;
};
export type AccountProductStockHistory = {
  _id: number;
  product: AccountProduct;
  location: AccountStockLocation;
  change: number;
  currentAmount: number;
  status: string;
  user: User;
  packageType?: AccountPackageType;
  createdAt: Date;
};
export type AccountFixtureStockHistory = {
  _id: number;
  fixture: AccountFixture;
  location: AccountStockLocation;
  change: number;
  currentAmount: number;
  status: string;
  user: User;
  createdAt: Date;
};
export type AccountFixtureStock = {
  _id: string;
  fixture: AccountFixture | string;
  location: string | AccountStockLocation;
  quantity: number;
};

export type Visit = {
  _id: number;
  location: number;
  date: string;
  user: User;
  startHour: string;
  finishHour?: string;
};

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
  kitchen: Kitchen | number;
  isAutoServed: boolean;
};
export type MenuPopular = {
  _id: number;
  order: number;
  item: MenuItem | number;
};
export type Kitchen = {
  _id: number;
  name: string;
};

export type MenuItem = {
  _id: number;
  name: string;
  description: string;
  imageUrl: string;
  category: MenuCategory | number;
  order: number;
  itemProduction?: {
    product: string;
    quantity: number;
  }[];
  price: number;
  locations: number[];
  priceHistory: {
    date: string;
    price: number;
  }[];
};
export type CheckoutIncome = {
  _id: number;
  user: User;
  location: AccountStockLocation;
  date: string;
  amount: number;
};
export type CheckoutControl = {
  _id: number;
  user: User;
  location: AccountStockLocation;
  date: string;
  amount: number;
};

export type CheckoutCashout = {
  _id: number;
  user: User;
  location: AccountStockLocation;
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
export type PanelControlCheckoutCash = {
  _id: number;
  description?: string;
  amount: number;
  date: string;
  user: User;
  location: AccountStockLocation;
};
export type Order = {
  _id: number;
  location: Location | number;
  item: MenuItem | number;
  table: Table | number;
  quantity: number;
  status: string;
  note?: string;
  unitPrice: number;
  createdAt: Date;
  createdBy: User | string;
  preparedAt?: Date;
  preparedBy?: User | string;
  deliveredAt?: Date;
  deliveredBy?: User | string;
  cancelledAt?: Date;
  cancelledBy?: User | string;
  paidQuantity: number;
  discount?: OrderDiscount | number;
  discountPercentage?: number;
};

export type OrderCollection = {
  _id: number;
  location: Location | number;
  createdAt: Date;
  createdBy: User | string;
  cancelledAt?: Date;
  cancelledBy?: User | string;
  cancelNote?: string;
  amount: number;
  status: string;
  paymentMethod: AccountPaymentMethod | string;
  orders?: OrderCollectionItem[];
  table: Table | number;
};

export type OrderCollectionItem = {
  order: number;
  paidQuantity: number;
};

export type OrderDiscount = {
  _id: number;
  name: string;
  percentage: number;
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
  approveHour: string;
  callCount: number;
  finishHour: string;
  status: ReservationStatusEnum;
};

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

export enum RoleEnum {
  MANAGER = 1,
  GAMEMASTER,
  GAMEMANAGER,
  CATERINGMANAGER,
  BARISTA,
  KITCHEN,
  SERVICE,
  CLEANING,
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

export enum LocationEnum {
  BAHCELI = 1,
  NEORAMA,
}
export enum StockLocationEnum {
  BAHCELI = "bahceli",
  NEORAMA = "neorama",
  AMAZON = "amazon",
}
export enum ExpensesPageTabEnum {
  INVOICE,
  FIXTUREINVOICE,
  SERVICEINVOICE,
  ALLEXPENSES,
}
export enum CountListPageTabEnum {
  COUNTARCHIVE,
  COUNTLISTS,
  COUNTLISTPRODUCTS,
}
export enum PanelControlPageTabEnum {
  PAGEPERMISSIONS,
  CHECKOUTCASH,
}
export enum PageDetailsPageTabEnum {
  PAGETABPERMISSIONS,
}
export enum FixtureCountListPageTabEnum {
  FIXTURECOUNTARCHIVE,
  FIXTURECOUNTLISTS,
  COUNTLISTFIXTURES,
}
export enum AccountingPageTabEnum {
  EXPENSETYPE,
  UNIT,
  VENDOR,
  BRAND,
  PACKAGETYPE,
  PRODUCT,
  FIXTURES,
  SERVICES,
  DISCOUNTS,
  PAYMENTMETHODS,
  STOCKLOCATION,
  KITCHENS,
}
export enum CheckoutPageTabEnum {
  INCOME,
  EXPENSE,
  CASHOUT,
  CHECKOUTCONTROL,
}
export enum StocksPageTabEnum {
  STOCK,
  FIXTURESTOCK,
  ENTERCONSUMPTION,
  PRODUCTSTOCKHISTORY,
  FIXTURESTOCKHISTORY,
}
export enum ProductPageTabEnum {
  PRODUCTPRICECHART,
  MENUITEMSWITHPRODUCT,
  PRODUCTEXPENSES,
  PRODUCTSTOCKHISTORY,
}

export enum VendorPageTabEnum {
  VENDORPRODUCTS,
  VENDORFIXTURES,
  VENDORSERVICES,
  VENDOREXPENSES,
  VENDORPAYMENTS,
}
export enum BrandPageTabEnum {
  BRANDPRODUCTS,
  BRANDFIXTURES,
  BRANDEXPENSES,
}
export enum FixturePageTabEnum {
  FIXTUREEXPENSES,
  FIXTURESTOCKHISTORY,
}
export enum ServicePageTabEnum {
  SERVICEEXPENSES,
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
  TRANSFERFIXTURETOINVOICE = "TRANSFERFIXTURETOINVOICE",
  TRANSFERINVOICETOFIXTURE = "TRANSFERINVOICETOFIXTURE",
  TRANSFERINVOICETOSERVICE = "TRANSFERINVOICETOSERVICE",
}
export enum OrderDataTabEnum {
  DAILYINCOME,
  GROUPEDPRODUCTSALESREPORT,
  SINGLEPRODUCTSALESREPORT,
  CATEGORYBASEDSALESREPORT,
  DISCOUNTBASEDSALES,
  COLLECTIONS,
  ORDERS,
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
    value: StockHistoryStatusEnum.TRANSFERFIXTURETOINVOICE,
    label: "Transfer Fixture To Invoice",
    backgroundColor: "bg-blue-700",
  },
  {
    value: StockHistoryStatusEnum.TRANSFERINVOICETOFIXTURE,
    label: "Transfer Invoice To Fixture",
    backgroundColor: "bg-lime-500",
  },
  {
    value: StockHistoryStatusEnum.TRANSFERINVOICETOSERVICE,
    label: "Transfer Invoice To Service",
    backgroundColor: "bg-rose-500",
  },
];

export enum ExpenseTypes {
  INVOICE = "Product Expense",
  FIXTURE = "Fixture Expense",
  SERVICE = "Service Expense",
}
export enum OrderStatus {
  PENDING = "pending",
  READYTOSERVE = "ready_to_serve",
  SERVED = "served",
  CANCELLED = "cancelled",
}

export enum OrderCollectionStatus {
  PAID = "paid",
  CANCELLED = "cancelled",
}
export enum ConstantPaymentMethodsIds {
  CASH = "cash",
  CREDITCARD = "credit_card",
  BANKTRANSFER = "bank_transfer",
}

export const NOTPAID = "Not Paid";

export const TURKISHLIRA = "₺";
