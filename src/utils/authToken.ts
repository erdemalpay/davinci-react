import Cookies from "js-cookie";

export const ACCESS_TOKEN = "jwt";

// The session token lives in localStorage. It used to be read from a
// session cookie, which phones drop whenever the browser is closed in the
// background (often on older phones), logging people out mid-shift while
// localStorage still had a valid token. The cookie is still written, as a
// fallback, with the token's own lifetime.
const COOKIE_DAYS = 365;

export function getAuthToken(): string | undefined {
  try {
    return localStorage.getItem(ACCESS_TOKEN) ?? Cookies.get(ACCESS_TOKEN);
  } catch {
    return Cookies.get(ACCESS_TOKEN);
  }
}

export function setAuthToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN, token);
  Cookies.set(ACCESS_TOKEN, token, { expires: COOKIE_DAYS });
}

export function clearAuthToken() {
  localStorage.removeItem(ACCESS_TOKEN);
  Cookies.remove(ACCESS_TOKEN);
}
