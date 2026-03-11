import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Slide, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { BreakOverlay } from "./components/common/BreakOverlay";
import { GameplayTimeOverlay } from "./components/common/GameplayTimeOverlay";
import { LogoutConfirmationModal } from "./components/common/LogoutConfirmationModal";
import { MiddlemanOverlay } from "./components/common/MiddlemanOverlay";
import { Sidebar } from "./components/common/Sidebar";
import { DataContextProvider } from "./context/Data.context";
import { DateContextProvider } from "./context/Date.context";
import { FilterContextProvider } from "./context/Filter.context";
import {
  GeneralContextProvider,
  useGeneralContext,
} from "./context/General.context";
import { LocationContextProvider } from "./context/Location.context";
import { OrderContextProvider } from "./context/Order.context";
import { ShiftContextProvider } from "./context/Shift.context";
import { UserContextProvider, useUserContext } from "./context/User.context";
import { useWebSocket } from "./hooks/useWebSocket";
import RouterContainer from "./navigation/routes";
import { ProfileTabEnum } from "./pages/Profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ChangePasswordModal() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setProfileActiveTab } = useGeneralContext();
  const [visible, setVisible] = useState(
    () => localStorage.getItem("mustChangePassword") === "true"
  );

  if (!visible) return null;

  const handleClose = () => {
    localStorage.removeItem("mustChangePassword");
    setVisible(false);
  };

  const handleGoToProfile = () => {
    handleClose();
    setProfileActiveTab(ProfileTabEnum.CHANGE_PASSWORD);
    navigate("/profile");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-60 z-[99999] p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 flex flex-col items-center gap-5 w-full max-w-sm text-center">
        <p className="text-blue-800 font-semibold text-lg">
          {t("You must change your password")}
        </p>
        <p className="text-gray-600 text-sm">
          {t("Please go to the following address to change your password.")}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            className="px-4 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
            onClick={handleClose}
          >
            {t("Later")}
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleGoToProfile}
          >
            {t("Go to profile page")}
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { isSidebarOpen } = useGeneralContext();
  const { user } = useUserContext();

  // Only connect to WebSocket when user is authenticated
  useWebSocket(!!user);

  return (
    <div className="App">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${
          user ? (isSidebarOpen ? "lg:ml-64" : "lg:ml-16") : ""
        }`}
      >
        <RouterContainer />
      </div>
      <BreakOverlay />
      <GameplayTimeOverlay />
      <MiddlemanOverlay />
      <LogoutConfirmationModal />
      {user && <ChangePasswordModal />}
      <ToastContainer
        autoClose={2000}
        hideProgressBar={true}
        transition={Slide}
        closeButton={false}
        position="bottom-right"
        style={{ zIndex: 999999 }}
      />
    </div>
  );
}

function AppWrapper() {
  const { user } = useUserContext();

  // Only load data when user is authenticated
  if (!user) {
    return <App />;
  }

  return (
    <OrderContextProvider>
      <ShiftContextProvider>
        <FilterContextProvider>
          <DataContextProvider>
            <App />
          </DataContextProvider>
        </FilterContextProvider>
      </ShiftContextProvider>
    </OrderContextProvider>
  );
}

function ContextWrapper() {
  const { user } = useUserContext();

  // Only load location context when user is authenticated
  if (!user) {
    return <AppWrapper />;
  }

  return (
    <LocationContextProvider>
      <AppWrapper />
    </LocationContextProvider>
  );
}

function Wrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <DateContextProvider>
        <UserContextProvider>
          <GeneralContextProvider>
            <ContextWrapper />
          </GeneralContextProvider>
        </UserContextProvider>
      </DateContextProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default Wrapper;
