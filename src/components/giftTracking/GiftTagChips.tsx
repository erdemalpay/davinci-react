import { useTranslation } from "react-i18next";
import { GiftTag } from "../../types";
import { getItem } from "../../utils/getItem";

type Props = { tagIds: number[]; tags: GiftTag[] };

export const GiftBlacklistBadge = () => {
  const { t } = useTranslation();
  return (
    <span className="px-2 py-0.5 rounded-full text-xs text-white bg-red-600">
      {t("Blacklist")}
    </span>
  );
};

const GiftTagChips = ({ tagIds, tags }: Props) => (
  <div className="flex flex-wrap gap-1">
    {tagIds.map((id) => {
      const tag = getItem(id, tags);
      return tag ? (
        <span
          key={id}
          className="px-2 py-0.5 rounded-full text-xs text-white"
          style={{ backgroundColor: tag.backgroundColor }}
        >
          {tag.name}
        </span>
      ) : null;
    })}
  </div>
);

export default GiftTagChips;
