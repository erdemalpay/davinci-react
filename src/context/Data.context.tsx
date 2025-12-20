import { PropsWithChildren, createContext, useContext } from "react";
import {
	AccountProduct,
	AccountStock,
	Kitchen,
	Location,
	Membership,
	MenuCategory,
	MenuItem,
	Order,
	OrderCollection,
	OrderDiscount,
	OrderNote,
	User,
} from "../types";
import { useGetAllAccountProducts } from "../utils/api/account/product";
import { useGetAccountStocks } from "../utils/api/account/stock";
import { MinimalGame, useGetGamesMinimal } from "../utils/api/game";
import { useGetStockLocations, useGetStoreLocations } from "../utils/api/location";
import { useGetMemberships } from "../utils/api/membership";
import { useGetAllCategories } from "../utils/api/menu/category";
import { useGetKitchens } from "../utils/api/menu/kitchen";
import { useGetMenuItems } from "../utils/api/menu/menu-item";
import { useGetTodayOrders } from "../utils/api/order/order";
import { useGetTodayCollections } from "../utils/api/order/orderCollection";
import { useGetOrderDiscounts } from "../utils/api/order/orderDiscount";
import { useGetOrderNotes } from "../utils/api/order/orderNotes";
import { MinimalUser, useGetUser, useGetUsersMinimal } from "../utils/api/user";

type DataContextType = {
  menuItems?: MenuItem[];
  todayOrders?: Order[];
  todayCollections?: OrderCollection[];
  categories?: MenuCategory[];
  games?: MinimalGame[];
  kitchens?: Kitchen[];
  products?: AccountProduct[];
  discounts?: OrderDiscount[];
  stockLocations?: Location[];
  storeLocations?: Location[];
  orderNotes?: OrderNote[];
  memberships?: Membership[];
  stocks?: AccountStock[];
  users?: MinimalUser[];
  user?: User;
};

const DataContext = createContext<DataContextType>({
  menuItems: undefined,
  todayOrders: undefined,
  todayCollections: undefined,
  categories: undefined,
  games: undefined,
  kitchens: undefined,
  products: undefined,
  discounts: undefined,
  stockLocations: undefined,
  storeLocations: undefined,
  orderNotes: undefined,
  memberships: undefined,
  stocks: undefined,
  users: undefined,
  user: undefined,
});

export const DataContextProvider = ({ children }: PropsWithChildren) => {
  // React Query hook'larını burada çağırıyoruz - sadece 1 observer oluşur
  const menuItems = useGetMenuItems();
  const todayOrders = useGetTodayOrders();
  const todayCollections = useGetTodayCollections();
  const categories = useGetAllCategories();
  const games = useGetGamesMinimal();
  const kitchens = useGetKitchens();
  const products = useGetAllAccountProducts();
  const discounts = useGetOrderDiscounts();
  const stockLocations = useGetStockLocations();
  const storeLocations = useGetStoreLocations();
  const orderNotes = useGetOrderNotes();
  const memberships = useGetMemberships();
  const stocks = useGetAccountStocks();
  const users = useGetUsersMinimal();
  const user = useGetUser();

  return (
    <DataContext.Provider
      value={{
        menuItems,
        todayOrders,
        todayCollections,
        categories,
        games,
        kitchens,
        products,
        discounts,
        stockLocations,
        storeLocations,
        orderNotes,
        memberships,
        stocks,
        users,
        user,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => useContext(DataContext);

