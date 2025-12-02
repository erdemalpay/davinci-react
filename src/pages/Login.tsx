import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { GenericButton } from "../components/common/GenericButton";
import { RoleEnum } from "../types";
import { LoginCredentials, useLogin } from "../utils/api/auth";
import { ACCESS_TOKEN } from "../utils/api/axiosClient";
import { Paths } from "../utils/api/factory";
import { getUserWithToken } from "../utils/api/user";

interface FormElements extends HTMLFormControlsCollection {
  username: HTMLInputElement;
  password: HTMLInputElement;
}

interface LoginFormElement extends HTMLFormElement {
  readonly elements: FormElements;
}

type RedirectLocationState = {
  from: Location;
};

const Login = () => {
  const { t } = useTranslation();
  const { state: locationState } = useLocation();
  const navigate = useNavigate();
  const from = locationState
    ? (locationState as RedirectLocationState).from
    : undefined;
  const onError = (error: unknown) => {
    console.log({ error });
    setError(true);
  };
  const { login } = useLogin(from, onError);
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const handleSubmit = async (event: React.FormEvent<LoginFormElement>) => {
    event.preventDefault();

    const { username, password } = (event.target as LoginFormElement).elements;
    const payload: LoginCredentials = {
      username: username.value,
      password: password.value,
    };

    setError(false);
    login(payload);
  };
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (token && localStorage.getItem("loggedIn")) {
          const loggedInUser = await getUserWithToken();

          if (
            loggedInUser &&
            [RoleEnum.KITCHEN, RoleEnum.KITCHEN2, RoleEnum.KITCHEN3].includes(
              loggedInUser.role._id
            )
          ) {
            navigate("/orders", { replace: true });
          } else if (loggedInUser) {
            navigate(Paths.Tables, { replace: true });
          }
        }
      } catch (error) {
        return;
      }
    };

    checkAuthentication();
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f0] relative flex items-center justify-center">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url('/src/assets/login/logo.png')`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px auto',
          filter: 'grayscale(1) brightness(0.5)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <form
          id="login"
          className="w-full text-gray-800"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col">
            <h2 className="text-5xl sm:text-6xl text-gray-800 dark:text-gray-100 leading-tight pt-8 font-bold text-center sm:text-left cursor-default select-none">
              Da Vinci Panel
            </h2>
          </div>
          <div className="mt-12 w-full">
            <div className="flex flex-col mt-5">
              <label
                htmlFor="username"
                className="text-lg text-gray-800 dark:text-gray-100 leading-tight cursor-default select-none"
              >
                {t("Username")}
              </label>
              <input
                required
                name="username"
                id="username"
                className={`h-10 px-2 w-full rounded mt-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 dark:border-gray-700 dark:focus:border-indigo-600 focus:outline-none focus:border focus:border-indigo-700 ${
                  error ? "border-red-300" : "border-gray-300"
                } border shadow transition-all duration-200 hover:shadow-md hover:border-gray-400`}
                type="text"
              />
            </div>
            <div className="flex flex-col mt-5">
              <label
                htmlFor="password"
                className="text-lg text-gray-800 dark:text-gray-100 fleading-tight cursor-default select-none"
              >
                {t("Password")}
              </label>
              <div className="relative">
                <input
                  required
                  name="password"
                  id="password"
                  className={`h-10 px-2 pr-10 w-full rounded mt-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 dark:border-gray-700 dark:focus:border-indigo-600 focus:outline-none focus:border focus:border-indigo-700  border shadow ${
                    error ? "border-red-300" : "border-gray-300"
                  } transition-all duration-200 hover:shadow-md hover:border-gray-400`}
                  type={showPassword ? "text" : "password"}
                  onKeyDown={(e) => {
                    setCapsLockOn(e.getModifierState("CapsLock"));
                  }}
                  onKeyUp={(e) => {
                    setCapsLockOn(e.getModifierState("CapsLock"));
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 mt-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {capsLockOn && (
                <div className="text-red-600 text-sm mt-1">
                  <span>{t("Caps Lock is on")}</span>
                </div>
              )}
            </div>
            {error && (
              <div className="flex text-red-600 text-sm mt-2">
                <h5>{t("Username or password is invalid")}</h5>
              </div>
            )}
          </div>
          <div className="w-full mt-6">
            <GenericButton
              type="submit"
              fullWidth
              className="bg-gray-800 hover:bg-gray-800 px-8 py-3 text-l transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
            >
              {t("Login")}
            </GenericButton>
          </div>
        </form>
      </div>
    </div>
  );
};
export default Login;
