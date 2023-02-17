import React from "react";
import { useLocation } from "react-router-dom";
import { LoginCredentials, useLogin } from "../utils/api/auth";

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
  const { state: locationState } = useLocation();
  const from = locationState
    ? (locationState as RedirectLocationState).from
    : undefined;
  const { login } = useLogin(from);
  const [error, setError] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<LoginFormElement>) => {
    event.preventDefault();

    const { username, password } = (event.target as LoginFormElement).elements;
    let payload: LoginCredentials = {
      username: username.value,
      password: password.value,
    };

    try {
      setError(false);
      login(payload);
    } catch (error) {
      setError(true);

      console.log({ error });
    }
  };
  return (
    <div>
      <section className="bg-white dark:bg-gray-900 {-- h-screen --}">
        <div className="mx-auto flex justify-center md:items-center relative md:h-full">
          <form
            id="login"
            className="w-full sm:w-4/6 md:w-3/6 lg:w-4/12 xl:w-3/12 text-gray-800 mb-32 sm:mb-0 my-40 sm:my-12 px-2 sm:px-0"
            onSubmit={handleSubmit}
          >
            <div className="px-2 flex flex-col items-center justify-center mt-8 sm:mt-0">
              <h2 className="text-4xl dark:text-gray-100 leading-tight pt-8">
                Da Vinci Panel
              </h2>
            </div>
            <div className="mt-12 w-full px-2 sm:px-6">
              <div className="flex flex-col mt-5">
                <label
                  htmlFor="username"
                  className="text-lg font-semibold dark:text-gray-100 leading-tight"
                >
                  Username
                </label>
                <input
                  required
                  name="username"
                  id="username"
                  className={`h-10 px-2 w-full rounded mt-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 dark:border-gray-700 dark:focus:border-indigo-600 focus:outline-none focus:border focus:border-indigo-700 ${
                    error ? "border-red-300" : "border-gray-300"
                  } border shadow`}
                  type="text"
                />
              </div>
              <div className="flex flex-col mt-5">
                <label
                  htmlFor="password"
                  className="text-lg font-semibold dark:text-gray-100 fleading-tight"
                >
                  Password
                </label>
                <input
                  required
                  name="password"
                  id="password"
                  className={`h-10 px-2 w-full rounded mt-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 dark:border-gray-700 dark:focus:border-indigo-600 focus:outline-none focus:border focus:border-indigo-700  border shadow ${
                    error ? "border-red-300" : "border-gray-300"
                  }`}
                  type="password"
                />
              </div>
              {error && (
                <div className="flex text-red-600 text-sm">
                  <h5>Username or password is invalid</h5>
                </div>
              )}
            </div>
            <div className="px-2 mb-16 sm:mb-56 md:mb-16 sm:px-6">
              <button className="focus:outline-none w-full bg-gray-800 transition duration-150 ease-in-out hover:bg-gray-600 rounded text-white px-8 py-3 text-sm mt-6">
                Login
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};
export default Login;
