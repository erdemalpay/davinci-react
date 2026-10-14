import { FiBookmark } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { useFavoritePages } from "../../hooks/useFavoritePages";

export function FavoritePagesNav() {
  const { t } = useTranslation();
  const { favoritePages } = useFavoritePages();
  const { resetGeneralContext, setSelectedMenuItem } = useGeneralContext();

  if (favoritePages.length === 0) return null;

  const getLabel = (page: (typeof favoritePages)[number]) =>
    page.parentName ? `${t(page.parentName)} / ${t(page.name)}` : t(page.name);

  return (
    <nav
      aria-label={t("Favorite pages")}
      className="hidden lg:flex h-full min-w-0 flex-1 items-stretch overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {favoritePages.map((page) => {
        const label = getLabel(page);

        return (
          <Link
            key={page.path}
            to={page.path}
            title={label}
            onClick={() => {
              resetGeneralContext();
              setSelectedMenuItem(null);
              window.scrollTo(0, 0);
            }}
            className="flex h-full min-w-10 max-w-48 flex-1 items-center gap-1.5 overflow-hidden border-l border-gray-700 px-3 text-sm text-gray-100 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <FiBookmark aria-hidden className="shrink-0 fill-current text-xs" />
            <span className="min-w-0 truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
