import Cookies from "js-cookie";
import { post } from "./index";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

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
      console.log({ response });
      const { token } = response;
      Cookies.set("jwt", token);
      toast.success("Logged in successfully");
      navigate(location ? `${location.pathname}${location.search}` : "/1");
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _newTable) => {},
  });
  return { login };
}
