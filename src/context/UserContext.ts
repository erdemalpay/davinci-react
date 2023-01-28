import { createContext } from "react";
import { User } from "../types";

type UserContextType = {
  user?: User;
  setUser: (user: User) => void;
};

export const UserContext = createContext<UserContextType>({
  setUser: () => {},
  user: undefined,
});
