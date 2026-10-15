import axios, { AxiosHeaders } from "axios";
import { clearAuthToken, getAuthToken } from "../authToken";

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  responseType: "json",
});

axiosClient.interceptors.request.use(
  async (req) => {
    const accessToken = getAuthToken();

    if (accessToken) {
      (req.headers as AxiosHeaders).set(
        "Authorization",
        `Bearer ${accessToken}`
      );
    }

    return req;
  },

  (err) => Promise.reject(err)
);

// Only a 401 means the session is over; the API answers 503 when it can't
// check the session (e.g. a slow database at a busy hour), and that must
// not log anyone out.
export function isSessionOver(error: unknown) {
  const response = (
    error as { response?: { status?: number; data?: { statusCode?: number } } }
  )?.response;
  return response?.status === 401 || response?.data?.statusCode === 401;
}

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const isLoginRequest = `${error?.config?.url ?? ""}`.includes(
      "/auth/login"
    );
    if (isSessionOver(error) && !isLoginRequest) {
      clearAuthToken();
    }
    return Promise.reject(error);
  }
);
