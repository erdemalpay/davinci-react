import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Slide, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { isSidebarOpen, isHoverExpanded } = useGeneralContext();
  const { user } = useUserContext();
  const isExpanded = isSidebarOpen || isHoverExpanded;

  // Only connect to WebSocket when user is authenticated
  useWebSocket(!!user);

  return (
    <div className="App">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${
          user ? (isExpanded ? "lg:ml-64" : "lg:ml-16") : ""
        }`}
      >
        <RouterContainer />
      </div>
      <BreakOverlay />
      <GameplayTimeOverlay />
      <MiddlemanOverlay />
      <LogoutConfirmationModal />
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
