import { useEffect, useRef, useState } from "react";

const HIDE_TIMEOUT_MS = 4 * 60 * 1000;

// A full-screen state that can be hidden for a while; it opens again after
// two minutes unless autoReopen is off (then only a click opens it).
export const useTemporarilyHiddenModal = (
  isActive: boolean,
  autoReopen = true
) => {
  const [isModalHidden, setIsModalHidden] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive) {
      setIsModalHidden(false);
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [isActive]);

  const handleHideModal = () => {
    setIsModalHidden(true);
    if (!autoReopen) return;
    // Auto-show modal after timeout
    hideTimeoutRef.current = setTimeout(() => {
      setIsModalHidden(false);
      hideTimeoutRef.current = null;
    }, HIDE_TIMEOUT_MS);
  };

  const handleShowModal = () => {
    setIsModalHidden(false);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  return {
    isModalHidden,
    handleHideModal,
    handleShowModal,
  };
};
