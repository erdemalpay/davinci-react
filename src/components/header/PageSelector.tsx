import { Bars3Icon } from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Cookies from "js-cookie";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { IoIosLogOut } from "react-icons/io";
import { useLocation, useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { useFilteredRoutes } from "../../hooks/useFilteredRoutes";
import { Role } from "../../types";
import { useGetBreaksByDate } from "../../utils/api/break";
import { useGetGameplayTimesByDate } from "../../utils/api/gameplaytime";
import { useGetPanelControlPages } from "../../utils/api/panelControl/page";
import { useGetUser } from "../../utils/api/user";
import { clearLocalStoragePreservingOnboarding } from "../../utils/onboardingStorage";
import AutocompleteInput from "../panelComponents/FormElements/AutocompleteInput";

export function PageSelector() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const queryClient = useQueryClient();
  const currentRoute = location.pathname;
  const { setUser } = useUserContext();
  const user = useGetUser();
  const { resetGeneralContext, setIsNotificationOpen, setIsLogoutModalOpen } =
    useGeneralContext();
  const [openGroups, setOpenGroups] = useState<{ [group: string]: boolean }>(
    {}
  );

  const routes = useFilteredRoutes();
  const pages = useGetPanelControlPages();
  const [searchValue, setSearchValue] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  // Active session checks
  const todayDate = format(new Date(), "yyyy-MM-dd");
  const activeBreaks = useGetBreaksByDate(todayDate);
  const activeGameplayTimes = useGetGameplayTimesByDate(todayDate);

  const userActiveBreak = activeBreaks?.find(
    (breakRecord) =>
      (typeof breakRecord.user === "string"
        ? breakRecord.user
        : breakRecord.user._id) === user?._id && !breakRecord.finishHour
  );

  const userActiveGameplayTime = activeGameplayTimes?.find(
    (gameplayTime) =>
      (typeof gameplayTime.user === "string"
        ? gameplayTime.user
        : gameplayTime.user._id) === user?._id && !gameplayTime.finishHour
  );

  const hasActiveSession = userActiveBreak || userActiveGameplayTime;

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  // Build menu options for autocomplete
  const menuOptionsList: Array<{ label: string; path: string; link?: string }> =
    [];

  routes.forEach((route) => {
    const filteredRouteChildren = route?.children?.filter(
      (child) =>
        child?.exceptionalRoles?.includes((user?.role as Role)?._id) ||
        pages?.some(
          (page) =>
            page.name === child.name &&
            page.permissionRoles?.includes((user?.role as Role)?._id)
        )
    );

    if (filteredRouteChildren && filteredRouteChildren?.length > 1) {
      filteredRouteChildren.forEach((child) => {
        if (child.isOnSidebar) {
          menuOptionsList.push({
            label: t(child.name),
            path: child.path || "",
            link: child.link,
          });
        }
      });
    } else if (filteredRouteChildren && filteredRouteChildren?.length === 1) {
      if (filteredRouteChildren[0].isOnSidebar) {
        menuOptionsList.push({
          label: t(filteredRouteChildren[0].name),
          path: filteredRouteChildren[0].path || "",
          link: filteredRouteChildren[0].link,
        });
      }
    } else if (route.isOnSidebar) {
      menuOptionsList.push({
        label: t(route.name),
        path: route.path || "",
        link: route.link,
      });
    }
  });

  const menuOptions = menuOptionsList.map((item) => ({
    value: item.label,
    label: item.label,
  }));

  const handleMenuSelect = (value: string) => {
    const selectedOption = menuOptionsList.find((opt) => opt.label === value);
    if (selectedOption) {
      if (selectedOption.link) {
        window.location.href = selectedOption.link;
      } else if (selectedOption.path) {
        resetGeneralContext();
        navigate(selectedOption.path);
        window.scrollTo(0, 0);
      }
    }
    setSearchValue(value);
  };

  function logout() {
    clearLocalStoragePreservingOnboarding();
    localStorage.setItem("loggedOut", "true");
    setTimeout(() => localStorage.removeItem("loggedOut"), 500);
    Cookies.remove("jwt");
    setUser(undefined);
    queryClient.clear();
    navigate("/login");
  }

  const handleLogoutClick = () => {
    // If user has active break or gameplay session, show warning modal
    if (hasActiveSession) {
      setIsLogoutModalOpen(true);
    } else {
      // No active session, logout directly
      logout();
    }
  };
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        className="text-sm text-white"
        onClick={() => {
          setIsNotificationOpen(false);
          setIsMenuOpen((prev) => !prev);
        }}
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-y-auto overflow-x-hidden no-scrollbar"
          style={{
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y",
            maxHeight: "calc(100dvh - 5rem)",
          }}
        >
          <div className="px-3 py-2">
            <AutocompleteInput
              placeholder={t("Search menu...") || "Search menu..."}
              value={searchValue}
              options={menuOptions}
              onChange={handleMenuSelect}
              onClear={() => setSearchValue("")}
              disabled={false}
              isOnClearActive={true}
              className="px-3 py-2 border border-gray-300 rounded-md text-base"
              minCharacters={1}
            />
          </div>
          {routes.map((route) => {
            const filteredRouteChildren = route?.children?.filter(
              (child) =>
                child?.exceptionalRoles?.includes((user?.role as Role)?._id) ||
                pages?.some(
                  (page) =>
                    page.name === child.name &&
                    page.permissionRoles?.includes((user?.role as Role)?._id)
                )
            );
            if (filteredRouteChildren && filteredRouteChildren?.length > 1) {
              return (
                <div key={route.name}>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 group flex items-center justify-between cursor-pointer hover:bg-gray-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroup(route.name);
                    }}
                  >
                    <span>{t(route.name)}</span>
                    {openGroups[route.name] ? (
                      <FiChevronDown className="text-lg" />
                    ) : (
                      <FiChevronRight className="text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    )}
                  </button>

                  {openGroups[route.name] &&
                    filteredRouteChildren
                      .filter((child) => child.isOnSidebar)
                      .map((child) => (
                        <button
                          type="button"
                          key={child.name}
                          className={`w-full text-left pl-6 pr-4 py-2 ${
                            child.path === currentRoute
                              ? "bg-gray-100 text-black"
                              : ""
                          }
                        ${
                          child.link &&
                          "text-blue-700 w-fit cursor-pointer hover:text-blue-500 transition-transform"
                        }    
                        `}
                          onClick={() => {
                            if (child.link) {
                              window.location.href = child.link;
                              return;
                            }
                            if (child.path) {
                              resetGeneralContext();
                              navigate(child.path);
                              window.scrollTo(0, 0);
                              setIsMenuOpen(false);
                            }
                          }}
                        >
                          {t(child.name)}
                        </button>
                      ))}
                </div>
              );
            } else if (
              filteredRouteChildren &&
              filteredRouteChildren?.length === 1
            ) {
              if (!filteredRouteChildren[0].isOnSidebar) return null;
              return (
                <button
                  type="button"
                  key={filteredRouteChildren[0].name}
                  className={`w-full text-left px-4 py-2 ${
                    filteredRouteChildren[0].path === currentRoute
                      ? "bg-gray-100 text-black"
                      : ""
                  } ${
                    filteredRouteChildren[0].link &&
                    "text-blue-700 w-fit cursor-pointer hover:text-blue-500 transition-transform"
                  }`}
                  onClick={() => {
                    if (
                      filteredRouteChildren &&
                      filteredRouteChildren[0].path
                    ) {
                      resetGeneralContext();
                      navigate(filteredRouteChildren[0].path);
                      window.scrollTo(0, 0);
                      setIsMenuOpen(false);
                    }
                    if (
                      filteredRouteChildren &&
                      filteredRouteChildren[0].link
                    ) {
                      window.location.href = filteredRouteChildren[0].link;
                      return;
                    }
                  }}
                >
                  {t(filteredRouteChildren[0].name)}
                </button>
              );
            } else {
              if (!route.isOnSidebar) return null;
              return (
                <button
                  type="button"
                  key={route.name}
                  className={`w-full text-left px-4 py-2 ${
                    route.path === currentRoute ? "bg-gray-100 text-black" : ""
                  } ${
                    route.link &&
                    "text-blue-700 w-fit cursor-pointer hover:text-blue-500 transition-transform"
                  }`}
                  onClick={() => {
                    if (currentRoute === route.path) return;
                    if (route.link) {
                      window.location.href = route.link;
                      return;
                    }
                    if (route.path) {
                      resetGeneralContext();
                      navigate(route.path);
                      window.scrollTo(0, 0);
                      setIsMenuOpen(false);
                    }
                  }}
                >
                  {t(route.name)}
                </button>
              );
            }
          })}

          <button
            type="button"
            className="w-full text-left flex flex-row gap-2 items-center px-4 py-2 hover:bg-gray-100"
            onClick={handleLogoutClick}
          >
            <IoIosLogOut className="text-lg" />
            {t("Logout")}
          </button>
        </div>
      )}
    </div>
  );
}
