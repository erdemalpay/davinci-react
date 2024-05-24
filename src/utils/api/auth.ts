import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Routes } from "../../navigation/constants";
import { post } from "./index";

interface LoginError {
  response: {
    data: {
      message: string;
      statusCode: number;
    };
  };
}

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

export function useLogin(
  location?: Location,
  onError?: (error: unknown) => void
) {
  const navigate = useNavigate();

  const { mutate: login } = useMutation<
    LoginResponse,
    LoginError,
    LoginCredentials
  >(loginMethod, {
    // We are updating tables query data with new item
    onSuccess: async (response) => {
      const { token } = response;
      Cookies.set("jwt", token);
      toast.success("Logged in successfully");
      localStorage.setItem("jwt", token);
      localStorage.setItem("loggedIn", "true");
      const target = location
        ? `${location.pathname}${location.search}`
        : Routes.Tables;
      navigate(target);
    },

    onError,
  });
  return { login };
}
