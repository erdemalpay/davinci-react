import { DragEvent, MouseEvent, useRef, useState } from "react";
import { FiBookmark } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { useFavoritePages } from "../../hooks/useFavoritePages";

export function FavoritePagesNav() {
  const { t } = useTranslation();
  const { favoritePages, isUpdating, reorderFavorite } = useFavoritePages();
  const { resetGeneralContext, setSelectedMenuItem } = useGeneralContext();
  const [draggedPath, setDraggedPath] = useState<string | null>(null);
  const [dropTargetPath, setDropTargetPath] = useState<string | null>(null);
  const didDragRef = useRef(false);

  if (favoritePages.length === 0) return null;

  const getLabel = (page: (typeof favoritePages)[number]) =>
    page.parentName ? `${t(page.parentName)} / ${t(page.name)}` : t(page.name);

  const handleDragStart = (
    event: DragEvent<HTMLAnchorElement>,
    path: string
  ) => {
    didDragRef.current = true;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", path);
    setDraggedPath(path);
  };

  const handleDragOver = (
    event: DragEvent<HTMLAnchorElement>,
    path: string
  ) => {
    if (!draggedPath || draggedPath === path) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTargetPath(path);
  };

  const handleDrop = (event: DragEvent<HTMLAnchorElement>, path: string) => {
    event.preventDefault();
    const sourcePath = draggedPath || event.dataTransfer.getData("text/plain");
    if (sourcePath && sourcePath !== path) {
      reorderFavorite(sourcePath, path);
    }
    setDraggedPath(null);
    setDropTargetPath(null);
  };

  const handleDragEnd = () => {
    setDraggedPath(null);
    setDropTargetPath(null);
    window.setTimeout(() => {
      didDragRef.current = false;
    }, 0);
  };

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (didDragRef.current) {
      event.preventDefault();
      return;
    }
    resetGeneralContext();
    setSelectedMenuItem(null);
    window.scrollTo(0, 0);
  };

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
            draggable={!isUpdating}
            onDragStart={(event) => handleDragStart(event, page.path)}
            onDragOver={(event) => handleDragOver(event, page.path)}
            onDragLeave={() => {
              if (dropTargetPath === page.path) setDropTargetPath(null);
            }}
            onDrop={(event) => handleDrop(event, page.path)}
            onDragEnd={handleDragEnd}
            onClick={handleClick}
            className={`flex h-full min-w-10 max-w-48 flex-1 cursor-grab items-center gap-1.5 overflow-hidden border-l border-gray-700 px-3 text-sm text-gray-100 transition-colors hover:bg-gray-700 hover:text-white active:cursor-grabbing ${
              draggedPath === page.path ? "opacity-50" : ""
            } ${
              dropTargetPath === page.path
                ? "bg-gray-700 ring-2 ring-inset ring-blue-400"
                : ""
            } ${isUpdating ? "cursor-wait opacity-60" : ""}`}
          >
            <FiBookmark aria-hidden className="shrink-0 fill-current text-xs" />
            <span className="min-w-0 truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
