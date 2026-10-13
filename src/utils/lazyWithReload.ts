import { ComponentType, lazy } from "react";

const RELOADED_KEY = "chunkReloadedAt";

// After a deploy, a panel that was already open asks for code files of the
// previous version, which no longer exist. Reload once to get the new
// version instead of showing a blank page.
export function reloadForNewVersion(error: unknown): never {
  let reloadedRecently = false;
  try {
    const last = Number(sessionStorage.getItem(RELOADED_KEY) ?? 0);
    reloadedRecently = Date.now() - last < 10_000;
    if (!reloadedRecently) {
      sessionStorage.setItem(RELOADED_KEY, String(Date.now()));
    }
  } catch {
    // sessionStorage unavailable: reload anyway, once per call.
  }
  if (!reloadedRecently) {
    window.location.reload();
  }
  throw error;
}

export function lazyWithReload<T extends ComponentType<any>>(
  load: () => Promise<{ default: T }>
) {
  return lazy(() => load().catch(reloadForNewVersion));
}
