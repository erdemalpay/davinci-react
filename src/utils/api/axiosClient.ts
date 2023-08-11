import axios, { AxiosHeaders } from "axios";
import Cookies from "js-cookie";

export const axiosClient = axios.create({
  baseURL: "https://api-staging.davinciboardgame.com/",
  responseType: "json",
});

export const ACCESS_TOKEN = "jwt";

axiosClient.interceptors.request.use(
  async (req) => {
    const accessToken = Cookies.get(ACCESS_TOKEN);

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

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error?.response?.data?.statusCode === 401) {
      Cookies.remove(ACCESS_TOKEN);
    }
    return Promise.reject(error);
  }
);
