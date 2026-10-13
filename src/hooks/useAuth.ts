import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserContext } from "../context/User.context";
import { isSessionOver } from "../utils/api/axiosClient";
import { Paths } from "../utils/api/factory";
import { getUserWithToken } from "../utils/api/user";
import { getAuthToken } from "../utils/authToken";
import { useGeneralContext } from "./../context/General.context";
import { languageOptions, RowPerPageEnum } from "./../types/index";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 1s, 2s, 4s ... up to 15s between tries.
export const retryDelay = (attempt: number) =>
  Math.min(1000 * 2 ** attempt, 15000);

const useAuth = () => {
  const { user, setUser } = useUserContext();
  const { setRowsPerPage } = useGeneralContext();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    const getUser = async (): Promise<void> => {
      if (user) return;
      const token = getAuthToken();
      if (!token) {
        navigate(Paths.Login, {
          replace: true,
          state: { from: location },
        });
      } else {
        // A busy or unreachable API is no reason to log out: keep trying
        // until the session is either confirmed or rejected (401).
        for (let attempt = 0; !cancelled; attempt++) {
          try {
            const loggedInUser = await getUserWithToken();
            if (cancelled) return;
            setUser(loggedInUser);
            i18n.changeLanguage(
              loggedInUser?.language ?? languageOptions[0].code
            );
            setRowsPerPage(loggedInUser?.rowsPerPage ?? RowPerPageEnum.FIRST);
            return;
          } catch (e) {
            console.log(e);
            if (isSessionOver(e)) {
              if (!cancelled) {
                navigate(Paths.Login, {
                  replace: true,
                  state: { from: location },
                });
              }
              return;
            }
            await wait(retryDelay(attempt));
          }
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
      cancelled = true;
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [user, setUser, navigate, location]);
  return { setUser };
};

export default useAuth;
