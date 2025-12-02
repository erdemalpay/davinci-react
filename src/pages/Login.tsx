import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
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
            <h2 className="text-5xl sm:text-6xl text-gray-800 dark:text-gray-100 leading-tight pt-8 font-bold">
              Da Vinci Panel
            </h2>
          </div>
          <div className="mt-12 w-full">
            <div className="flex flex-col mt-5">
              <label
                htmlFor="username"
                className="text-lg text-gray-800 dark:text-gray-100 leading-tight"
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
                className="text-lg text-gray-800 dark:text-gray-100 fleading-tight"
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
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
              className="bg-gray-800 hover:bg-gray-800 px-8 py-3 text-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
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
