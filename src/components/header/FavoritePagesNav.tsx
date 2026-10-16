import { useRef, useState } from "react";
import { FiBookmark } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { useFavoritePages } from "../../hooks/useFavoritePages";
import type { FavoritePage } from "../../utils/favoritePages";

export function FavoritePagesNav() {
  const { t } = useTranslation();
  const { favoritePages, reorderFavorites } = useFavoritePages();
  const { resetGeneralContext, setSelectedMenuItem } = useGeneralContext();
  // null unless a page is being dragged; then it holds the live order
  const [draggedPages, setDraggedPages] = useState<FavoritePage[] | null>(null);
  const draggedPathRef = useRef<string | null>(null);
  const currentPages = draggedPages ?? favoritePages;

  if (currentPages.length === 0) return null;

  const getLabel = (page: FavoritePage) =>
    page.parentName ? `${t(page.parentName)} / ${t(page.name)}` : t(page.name);

  const movePage = (draggedPath: string, targetPath: string) => {
    const from = currentPages.findIndex((page) => page.path === draggedPath);
    const to = currentPages.findIndex((page) => page.path === targetPath);
    if (from === -1 || to === -1 || from === to) return;
    const next = [...currentPages];
    const [dragged] = next.splice(from, 1);
    next.splice(to, 0, dragged);
    setDraggedPages(next);
  };

  const finishDrag = () => {
    draggedPathRef.current = null;
    if (!draggedPages) return;
    const orderedPaths = draggedPages.map((page) => page.path);
    const isChanged = orderedPaths.some(
      (path, index) => path !== favoritePages[index]?.path
    );
    setDraggedPages(null);
    if (isChanged) reorderFavorites(orderedPaths);
  };

  return (
    <nav
      aria-label={t("Favorite pages")}
      className="hidden lg:flex h-full min-w-0 flex-1 items-stretch overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {currentPages.map((page) => {
        const label = getLabel(page);

        return (
          <Link
            key={page.path}
            to={page.path}
            title={label}
            draggable
            onDragStart={() => {
              draggedPathRef.current = page.path;
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => {
              if (draggedPathRef.current) {
                movePage(draggedPathRef.current, page.path);
              }
            }}
            onDragEnd={finishDrag}
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
