import { useTranslation } from "react-i18next";
import { useNewVersionReload } from "../../hooks/useNewVersionReload";

// Reloads open panels into a new deploy when nobody is busy, and offers to
// do it right away meanwhile.
export function NewVersionBanner() {
  const { t } = useTranslation();
  const { isNewVersionReady } = useNewVersionReload();

  if (!isNewVersionReady) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[999998] flex items-center gap-3 rounded-full bg-blue-600 px-4 py-2 text-sm text-white shadow-lg">
      <span>{t("A new version of the panel is ready.")}</span>
      <button
        className="rounded-full bg-white px-3 py-0.5 font-semibold text-blue-700 hover:bg-blue-50"
        onClick={() => window.location.reload()}
      >
        {t("Refresh")}
      </button>
    </div>
  );
}
