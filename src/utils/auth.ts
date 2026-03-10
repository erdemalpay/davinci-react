// Utility to decide whether queries should be enabled by default.
// Centralizes the logic so we don't repeat the localStorage JWT check everywhere.
export function shouldEnableQuery(enabled?: boolean): boolean {
  const defaultEnabled = !!localStorage.getItem("jwt");
  return typeof enabled !== "undefined" ? enabled : defaultEnabled;
}
