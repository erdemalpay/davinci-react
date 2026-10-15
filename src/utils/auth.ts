import { getAuthToken } from "./authToken";

// Utility to decide whether queries should be enabled by default.
// Centralizes the logic so we don't repeat the JWT check everywhere.
export function shouldEnableQuery(enabled?: boolean): boolean {
  const defaultEnabled = !!getAuthToken();
  return typeof enabled !== "undefined" ? enabled : defaultEnabled;
}
