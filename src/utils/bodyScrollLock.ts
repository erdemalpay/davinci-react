let scrollLockCount = 0;
const NO_SCROLL_CLASS = "no-scroll";
const isBrowser = typeof document !== "undefined";

export const lockBodyScroll = () => {
  if (!isBrowser) return;
  scrollLockCount += 1;
  if (scrollLockCount === 1) {
    document.body.classList.add(NO_SCROLL_CLASS);
  }
};

export const unlockBodyScroll = () => {
  if (!isBrowser || scrollLockCount === 0) return;
  scrollLockCount -= 1;
  if (scrollLockCount === 0) {
    document.body.classList.remove(NO_SCROLL_CLASS);
  }
};
