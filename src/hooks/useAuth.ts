import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserContext } from "../context/User.context";
import { ACCESS_TOKEN } from "../utils/api/axiosClient";
import { Paths } from "../utils/api/factory";
import { getUserWithToken } from "../utils/api/user";
import { useGeneralContext } from "./../context/General.context";
import { languageOptions, RowPerPageEnum } from "./../types/index";

const useAuth = () => {
  const { user, setUser } = useUserContext();
  const { setRowsPerPage } = useGeneralContext();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getUser = async (): Promise<void> => {
      if (user) return;
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        navigate(Paths.Login, {
          replace: true,
          state: { from: location },
        });
      } else {
        try {
          const loggedInUser = await getUserWithToken();
          setUser(loggedInUser);
          i18n.changeLanguage(
            loggedInUser?.language ?? languageOptions[0].code
          );
          setRowsPerPage(loggedInUser?.rowsPerPage ?? RowPerPageEnum.FIRST);
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
