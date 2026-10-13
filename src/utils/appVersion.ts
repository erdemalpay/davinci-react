// Set at build time (vite.config.ts); missing in tests.
declare const __BUILD_ID__: string | undefined;

export const BUILD_ID =
  typeof __BUILD_ID__ === "string" ? __BUILD_ID__ : undefined;

// The build id of the version deployed now, or null when it can't be told
// (offline, or a deploy from before version.json existed: the SPA rewrite
// then answers with index.html).
export async function fetchDeployedBuildId(): Promise<string | null> {
  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data?.buildId === "string" ? data.buildId : null;
  } catch {
    return null;
  }
}

const RELOADED_FOR_KEY = "reloadedForBuild";

// Reloads to get the deployed version, at most once per version: right
// after a deploy the CDN may still serve the old page for a moment, and the
// panel must not reload over and over meanwhile.
export function reloadForBuild(buildId: string): boolean {
  try {
    if (sessionStorage.getItem(RELOADED_FOR_KEY) === buildId) return false;
    sessionStorage.setItem(RELOADED_FOR_KEY, buildId);
  } catch {
    // sessionStorage unavailable: reload anyway.
  }
  window.location.reload();
  return true;
}

const OPEN_DIALOG_SELECTOR =
  '[role="dialog"], [aria-modal="true"], .fixed.inset-0';

// Someone is in the middle of something: a dialog (payment, adding an
// order, a confirmation) is open or a field has focus. The panel never
// reloads by itself then.
export function isUserBusy(): boolean {
  const active = document.activeElement;
  if (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement ||
    active instanceof HTMLSelectElement ||
    (active instanceof HTMLElement && active.isContentEditable)
  ) {
    return true;
  }
  return Array.from(document.querySelectorAll(OPEN_DIALOG_SELECTOR)).some(
    (element) => element.getClientRects().length > 0
  );
}
