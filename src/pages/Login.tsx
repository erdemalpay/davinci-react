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
    <div className="min-h-screen bg-gradient-to-br from-[#f5f5f0] via-[#e8e8dd] to-[#f5f5f0] relative flex items-center justify-center overflow-hidden">
      {/* Animated background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none animate-pulse"
        style={{
          backgroundImage: `url('/src/assets/login/logo.png')`,
          backgroundRepeat: 'repeat',
          backgroundSize: '250px auto',
          backgroundPosition: '-25px 0',
          filter: 'grayscale(1) brightness(0.5)',
          animation: 'float 20s ease-in-out infinite',
        }}
      />

      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-gray-200/30 to-transparent rounded-full blur-3xl animate-bounce" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-tl from-gray-300/20 to-transparent rounded-full blur-3xl animate-bounce" style={{ animationDuration: '12s', animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-gray-200/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-4 flex items-start justify-center min-h-screen">
        <form
          id="login"
          className="w-full text-gray-800 bg-white rounded-3xl p-8 py-12 shadow-2xl border border-gray-100 transition-all duration-300 relative overflow-hidden mt-[20vh]"
          onSubmit={handleSubmit}
          style={{
            animation: 'slideUp 0.6s ease-out',
          }}
        >
          {/* Card background image */}
          <div
            className="absolute pointer-events-none"
            style={{
              opacity: 0.2,
              transform: showPassword
                ? 'scaleX(-1) translate(-12px, -8px)'
                : 'scaleX(-1) translate(0px, 0px)',
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              top: '-10px',
              left: 0,
              right: 0,
              height: '500px',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url('/src/assets/login/davinci.png')`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: '-80px center',
                backgroundSize: 'contain',
                opacity: showPassword ? 0 : 1,
                transition: 'opacity 0.4s ease-in-out',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url('/src/assets/login/davinci2.png')`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: '-80px center',
                backgroundSize: 'contain',
                opacity: showPassword ? 1 : 0,
                transition: 'opacity 0.4s ease-in-out',
              }}
            />
          </div>
          <div className="flex flex-col mb-2 relative z-10">
            <h2
              className="text-4xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 leading-tight font-bold text-center sm:text-left cursor-default select-none drop-shadow-sm"
              style={{
                animation: 'fadeInScale 0.8s ease-out 0.2s both',
              }}
            >
              Da Vinci Panel
            </h2>

          </div>
          <div className="mt-12 w-full relative z-10">
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
                className={`h-12 px-4 w-full rounded-xl mt-2 text-gray-700 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:bg-white ${
                  error ? "border-red-400 ring-2 ring-red-200" : "border-gray-200"
                } border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-gray-300 hover:-translate-y-0.5`}
                type="text"
                style={{ animation: 'fadeInUp 0.6s ease-out 0.4s both' }}
              />
            </div>
            <div className="flex flex-col mt-5">
              <label
                htmlFor="password"
                className="text-lg text-gray-800 dark:text-gray-100 fleading-tight cursor-default select-none"
              >
                {t("Password")}
              </label>
              <div className="relative" style={{ animation: 'fadeInUp 0.6s ease-out 0.5s both' }}>
                <input
                  required
                  name="password"
                  id="password"
                  className={`h-12 px-4 pr-12 w-full rounded-xl mt-2 text-gray-700 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:bg-white ${
                    error ? "border-red-400 ring-2 ring-red-200" : "border-gray-200"
                  } border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-gray-300 hover:-translate-y-0.5`}
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 mt-1 text-gray-500 hover:text-gray-800 focus:outline-none transition-all duration-200 hover:scale-110 active:scale-95"
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
                <div className="text-red-600 text-sm mt-2 bg-red-50 px-3 py-1 rounded-lg border border-red-200">
                  <span> {t("Caps Lock is on")}</span>
                </div>
              )}
            </div>
            {error && (
              <div className="flex text-red-600 text-sm mt-3 bg-red-50 px-4 py-2 rounded-lg border-2 border-red-300">
                <h5> {t("Username or password is invalid")}</h5>
              </div>
            )}
          </div>
          <div className="w-full mt-8 relative z-10" style={{ animation: 'fadeInUp 0.6s ease-out 0.6s both' }}>
            <GenericButton
              type="submit"
              fullWidth
              className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 px-8 py-4 text-lg font-semibold transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] rounded-xl relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {t("Login")}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </GenericButton>
          </div>
        </form>
      </div>
    </div>
  );
};
export default Login;
