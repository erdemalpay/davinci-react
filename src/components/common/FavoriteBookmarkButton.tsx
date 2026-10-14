import { MouseEvent } from "react";
import { FiBookmark } from "react-icons/fi";
import { useTranslation } from "react-i18next";

type FavoriteBookmarkButtonProps = {
  pageName: string;
  path: string;
  isFavorite: boolean;
  disabled?: boolean;
  onToggle: (path: string) => void;
};

export function FavoriteBookmarkButton({
  pageName,
  path,
  isFavorite,
  disabled = false,
  onToggle,
}: FavoriteBookmarkButtonProps) {
  const { t } = useTranslation();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggle(path);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={t(
        isFavorite ? "Remove page from favorites" : "Add page to favorites",
        { page: t(pageName) }
      )}
      className={`ml-1 flex-shrink-0 rounded-md p-2 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:cursor-wait disabled:opacity-60 ${
        isFavorite ? "text-blue-600" : "text-gray-400"
      }`}
    >
      <FiBookmark className={isFavorite ? "fill-current" : undefined} />
    </button>
  );
}
