import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  BUILD_ID,
  fetchDeployedBuildId,
  isUserBusy,
  reloadForBuild,
} from "../utils/appVersion";

export const CHECK_EVERY_MS = 5 * 60 * 1000;
export const IDLE_BEFORE_RELOAD_MS = 60 * 1000;
const IDLE_CHECK_EVERY_MS = 15 * 1000;
const INPUT_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"];

// Open panels pick up a new deploy by themselves instead of running the old
// code until someone refreshes. The reload waits for a moment nobody is in
// the middle of something: a page change, coming back to the panel, or a
// minute without input; never while a dialog is open or a field has focus.
// Returns whether a new version is waiting, for the "refresh" banner.
export function useNewVersionReload() {
  const { pathname } = useLocation();
  const [deployedBuildId, setDeployedBuildId] = useState<string | null>(null);
  const deployedRef = useRef<string | null>(null);
  const lastInputAt = useRef(Date.now());

  const reloadIfIdle = useCallback(() => {
    const deployed = deployedRef.current;
    if (deployed && !isUserBusy()) reloadForBuild(deployed);
  }, []);

  const check = useCallback(async () => {
    if (!BUILD_ID || deployedRef.current) return;
    const deployed = await fetchDeployedBuildId();
    if (deployed && deployed !== BUILD_ID) {
      deployedRef.current = deployed;
      setDeployedBuildId(deployed);
    }
  }, []);

  useEffect(() => {
    if (!BUILD_ID) return;
    void check();
    const checkTimer = window.setInterval(check, CHECK_EVERY_MS);
    const idleTimer = window.setInterval(() => {
      if (Date.now() - lastInputAt.current >= IDLE_BEFORE_RELOAD_MS) {
        reloadIfIdle();
      }
    }, IDLE_CHECK_EVERY_MS);
    const onInput = () => {
      lastInputAt.current = Date.now();
    };
    // Back to the panel (phone unlocked, tab shown): reload before it's used.
    const onVisible = async () => {
      if (document.visibilityState !== "visible") return;
      await check();
      reloadIfIdle();
    };
    INPUT_EVENTS.forEach((event) =>
      window.addEventListener(event, onInput, { passive: true })
    );
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(checkTimer);
      window.clearInterval(idleTimer);
      INPUT_EVENTS.forEach((event) =>
        window.removeEventListener(event, onInput)
      );
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [check, reloadIfIdle]);

  // Moved to another page: nothing is half done, load the new version there.
  const previousPathname = useRef(pathname);
  useEffect(() => {
    if (pathname === previousPathname.current) return;
    previousPathname.current = pathname;
    if (deployedRef.current) reloadForBuild(deployedRef.current);
  }, [pathname]);

  return { isNewVersionReady: !!deployedBuildId };
}
