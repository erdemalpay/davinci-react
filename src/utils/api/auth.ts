import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Routes } from "../../navigation/constants";
import { post } from "./index";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

async function loginMethod(payload: LoginCredentials) {
  return post<LoginCredentials, LoginResponse>({
    path: "/auth/login",
    payload,
  });
}

export function useLogin(location?: Location) {
  const navigate = useNavigate();

  const { mutate: login } = useMutation(loginMethod, {
    // We are updating tables query data with new item
    onSuccess: async (response) => {
      const { token } = response;
      Cookies.set("jwt", token);
      toast.success("Logged in successfully");
      const target = location
        ? `${location.pathname}${location.search}`
        : Routes.Tables;
      navigate(target);
    },
  });
  return { login };
}
