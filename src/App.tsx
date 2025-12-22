import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useRef } from "react";
import { Slide, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
import { usePageVisibility } from "./hooks/usePageVisibility";
import { useWebSocket } from "./hooks/useWebSocket";
import RouterContainer from "./navigation/routes";

const queryClient = new QueryClient();

function App() {
  const isVisible = usePageVisibility();
  const queryClient = useQueryClient();
  const { isSidebarOpen } = useGeneralContext();
  const { user } = useUserContext();
  const prevVisibleRef = useRef(isVisible);

  useWebSocket();

  // useEffect(() => {
  //   if (prevVisibleRef.current === false && isVisible === true) {
  //     queryClient.clear();
  //   }
  //   prevVisibleRef.current = isVisible;
  // }, [isVisible, queryClient]);

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

function Wrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <DateContextProvider>
        <LocationContextProvider>
          <UserContextProvider>
            <GeneralContextProvider>
              <OrderContextProvider>
                <ShiftContextProvider>
                  <FilterContextProvider>
                    <DataContextProvider>
                      <App />
                    </DataContextProvider>
                  </FilterContextProvider>
                </ShiftContextProvider>
              </OrderContextProvider>
            </GeneralContextProvider>
          </UserContextProvider>
        </LocationContextProvider>
      </DateContextProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default Wrapper;
