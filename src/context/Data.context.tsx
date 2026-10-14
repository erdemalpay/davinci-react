import { PropsWithChildren, createContext, useContext } from "react";
import {
  Kitchen,
  Location,
  MenuCategory,
  MenuItem,
  OrderDiscount,
  OrderNote,
  PanelSettings,
  User,
  Visit,
} from "../types";
import { MinimalGame, useGetGamesMinimal } from "../utils/api/game";
import {
  useGetStockLocations,
  useGetStoreLocations,
} from "../utils/api/location";
import { useGetAllCategories } from "../utils/api/menu/category";
import { useGetKitchens } from "../utils/api/menu/kitchen";
import { useGetMenuItems } from "../utils/api/menu/menu-item";
import { useGetOrderDiscounts } from "../utils/api/order/orderDiscount";
import { useGetOrderNotes } from "../utils/api/order/orderNotes";
import { useGetPanelSettings } from "../utils/api/panelControl/panelSettings";
import { MinimalUser, useGetUser, useGetUsersMinimal } from "../utils/api/user";
import { useGetVisits } from "../utils/api/visit";

type DataContextType = {
  menuItems?: MenuItem[];
  categories?: MenuCategory[];
  games?: MinimalGame[];
  kitchens?: Kitchen[];
  discounts?: OrderDiscount[];
  stockLocations?: Location[];
  storeLocations?: Location[];
  orderNotes?: OrderNote[];
  users?: MinimalUser[];
  user?: User;
  visits?: Visit[];
  panelSettings?: PanelSettings;
};

const DataContext = createContext<DataContextType>({
  menuItems: undefined,
  categories: undefined,
  games: undefined,
  kitchens: undefined,
  discounts: undefined,
  stockLocations: undefined,
  storeLocations: undefined,
  orderNotes: undefined,
  users: undefined,
  user: undefined,
  visits: undefined,
  panelSettings: undefined,
});

// The day's orders and collections, stocks, products and memberships are
// not here on purpose: they change all the time (or are big) and every
// component using this context re-rendered with them. The tables pages
// load them themselves.
export const DataContextProvider = ({ children }: PropsWithChildren) => {
  // React Query hook'larını burada çağırıyoruz - sadece 1 observer oluşur
  const menuItems = useGetMenuItems();
  const categories = useGetAllCategories();
  const games = useGetGamesMinimal();
  const kitchens = useGetKitchens();
  const discounts = useGetOrderDiscounts();
  const stockLocations = useGetStockLocations();
  const storeLocations = useGetStoreLocations();
  const orderNotes = useGetOrderNotes();
  const users = useGetUsersMinimal();
  const user = useGetUser();
  const visits = useGetVisits();
  const panelSettings = useGetPanelSettings();

  return (
    <DataContext.Provider
      value={{
        menuItems,
        categories,
        games,
        kitchens,
        discounts,
        stockLocations,
        storeLocations,
        orderNotes,
        users,
        user,
        visits,
        panelSettings,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => useContext(DataContext);
