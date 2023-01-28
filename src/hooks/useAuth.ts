import { useEffect, useContext } from "react";
import { ACCESS_TOKEN } from "../utils/api/axiosClient";
import { getUserWithToken } from "../utils/api/user";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { UserContext } from "../context/UserContext";
import { Paths } from "../utils/api/factory";

const useAuth = () => {
  const { user, setUser } = useContext(UserContext);
  let location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async (): Promise<void> => {
      try {
        if (user) return;
        const token = Cookies.get(ACCESS_TOKEN);
        if (!token)
          navigate(Paths.Login, { replace: true, state: { from: location } });
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
