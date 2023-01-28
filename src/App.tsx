import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useIsMutating,
} from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Slide, ToastContainer } from "react-toastify";
import { LocationContext } from "./context/LocationContext";
import { SelectedDateContext } from "./context/SelectedDateContext";
import RouterContainer from "./navigation/routes";
import { formatDate } from "./utils/dateFilter";

import "react-toastify/dist/ReactToastify.css";
import { User } from "./types";
import { UserContext } from "./context/UserContext";

function App() {
  const { location } = useParams();

  const [selectedLocationId, setSelectedLocationId] = useState<number>(
    Number(location) || 1
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    formatDate(new Date())
  );

  const [user, setUser] = useState<User>();

  const isMutating = useIsMutating();

  const initalLocationValue = {
    selectedLocationId,
    setSelectedLocationId,
  };

  const initialSelectedDateValue = {
    selectedDate,
    setSelectedDate,
  };

  const initialUserValue = {
    user,
    setUser,
  };

  return (
    <div className="App">
      <SelectedDateContext.Provider value={initialSelectedDateValue}>
        <LocationContext.Provider value={initalLocationValue}>
          <UserContext.Provider value={initialUserValue}>
            {isMutating ? (
              <div className="absolute inset-0 w-full h-full z-50 opacity-50 bg-black text-white">
                <div className="flex justify-center w-full h-full items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <h1 className="text-2xl">Loading...</h1>
                </div>
              </div>
            ) : null}
            <RouterContainer />
            <ToastContainer
              autoClose={2000}
              hideProgressBar={true}
              transition={Slide}
              closeButton={false}
            />
          </UserContext.Provider>
        </LocationContext.Provider>
      </SelectedDateContext.Provider>
    </div>
  );
}

// We are wrapping the App component to be able to use isMutating hooks in it
function Wrapper() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

export default Wrapper;
