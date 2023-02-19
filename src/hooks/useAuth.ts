import Cookies from "js-cookie";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserContext } from "../context/User.context";
import { ACCESS_TOKEN } from "../utils/api/axiosClient";
import { Paths } from "../utils/api/factory";
import { getUserWithToken } from "../utils/api/user";

const useAuth = () => {
  const { user, setUser } = useUserContext();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async (): Promise<void> => {
      try {
        console.log({ user });
        if (user) return;
        const token = Cookies.get(ACCESS_TOKEN);
        if (!token)
          return navigate(Paths.Login, {
            replace: true,
            state: { from: location },
          });
        const loggedInUser = await getUserWithToken();
        setUser(loggedInUser);
      } catch (e) {
        console.log(e);
      }
    };
    getUser();
  }, [user, setUser, navigate, location]);
};

export default useAuth;
