import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserContext } from "../context/User.context";
import { ACCESS_TOKEN } from "../utils/api/axiosClient";
import { Paths } from "../utils/api/factory";
import { getUserWithToken } from "../utils/api/user";

const useAuth = () => {
  const { user, setUser } = useUserContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getUser = async (): Promise<void> => {
      if (user) return;
      let token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        navigate(Paths.Login, {
          replace: true,
          state: { from: location },
        });
      } else {
        try {
          const loggedInUser = await getUserWithToken();
          setUser(loggedInUser);
        } catch (e) {
          console.log(e);
          navigate(Paths.Login, {
            replace: true,
            state: { from: location },
          });
        }
      }
    };

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === "loggedOut" && event.newValue === "true") {
        setUser(undefined);
        navigate(Paths.Login, {
          replace: true,
        });
      }
    };

    window.addEventListener("storage", handleStorageEvent);
    getUser();
    return () => {
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [user, setUser, navigate, location]);
  return { setUser };
};

export default useAuth;
