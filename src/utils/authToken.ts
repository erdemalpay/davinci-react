import Cookies from "js-cookie";

export const ACCESS_TOKEN = "jwt";

// The session token lives only in localStorage. It used to be read from a
// session cookie, which phones drop whenever the browser is closed in the
// background (often on older phones), logging people out mid-shift. Without
// a token in localStorage the user goes to the login page.
export function getAuthToken(): string | undefined {
  try {
    return localStorage.getItem(ACCESS_TOKEN) ?? undefined;
  } catch {
    return undefined;
  }
}

export function setAuthToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN, token);
}

export function clearAuthToken() {
  localStorage.removeItem(ACCESS_TOKEN);
  // Older logins also wrote the token to a cookie; drop it on logout.
  Cookies.remove(ACCESS_TOKEN);
}
