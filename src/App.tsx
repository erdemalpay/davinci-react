import {
  QueryClient,
  QueryClientProvider,
  useIsMutating,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { Slide, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "./components/common/Loading";
import { Sidebar } from "./components/common/Sidebar";
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
import { usePageVisibility } from "./hooks/usePageVisibility";
import { useWebSocket } from "./hooks/useWebSocket";
import RouterContainer from "./navigation/routes";

function App() {
  const isMutating = useIsMutating();
  const isVisible = usePageVisibility();
  const queryClient = useQueryClient();
  const { isSidebarOpen } = useGeneralContext();
  const { user } = useUserContext();

  // webSocket connection
  useWebSocket();
  // when page visibility gone invalidate queries
  useEffect(() => {
    if (!isVisible) {
      queryClient.clear();
    }
  }, [isVisible, queryClient]);

  return (
    <div className="App">
      {isMutating ? <Loading /> : null}
      <Sidebar />
      {/* Content wrapper - sidebar durumuna göre dinamik margin */}
      <div
        className={`transition-all duration-300 ${
          user ? (isSidebarOpen ? "lg:ml-64" : "lg:ml-16") : ""
        }`}
      >
        <RouterContainer />
      </div>
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

// We are wrapping the App component to be able to use isMutating hooks in it
function Wrapper() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <DateContextProvider>
        <LocationContextProvider>
          <UserContextProvider>
            <GeneralContextProvider>
              <OrderContextProvider>
                <ShiftContextProvider>
                  <FilterContextProvider>
                    <App />
                  </FilterContextProvider>
                </ShiftContextProvider>
              </OrderContextProvider>
            </GeneralContextProvider>
          </UserContextProvider>
        </LocationContextProvider>
      </DateContextProvider>
    </QueryClientProvider>
  );
}

export default Wrapper;
