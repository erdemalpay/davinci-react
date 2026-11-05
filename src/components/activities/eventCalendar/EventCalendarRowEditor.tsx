import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { toast } from "react-toastify";
import { EventCalendarItem } from "../../../types";
import { uploadOriginalImage } from "../../../utils/api/asset";
import {
  BADGE_COLORS,
  EVENT_CALENDAR_ICON_KEYS,
  getEventCalendarCard,
  getEventCalendarIconSrc,
} from "../../../utils/eventCalendarAssets";
import { GenericButton } from "../../common/GenericButton";
import TextInput from "../../panelComponents/FormElements/TextInput";

interface Props {
  item: EventCalendarItem;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<EventCalendarItem>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}

const EventCalendarRowEditor = ({
  item,
  isFirst,
  isLast,
  onChange,
  onMove,
  onRemove,
}: Props) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const isPreset = EVENT_CALENDAR_ICON_KEYS.includes(item.icon);

  const uploadIcon = async (file: File) => {
    setIsUploading(true);
    try {
      onChange({ icon: await uploadOriginalImage(file, "event-calendar") });
    } catch {
      toast.error(t("Image upload failed"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl bg-white p-3 flex flex-col gap-3">
      <div className="flex gap-3">
        <div className="flex flex-col gap-1 w-40 shrink-0">
          <label className="text-xs font-medium text-gray-700">
            {t("Badge Text")}
          </label>
          {[0, 1, 2].map((index) => {
            const changeLine = (value: string) => {
              const badge = [...item.badge];
              badge[index] = value;
              onChange({ badge });
            };
            return (
              <TextInput
                key={index}
                type="text"
                value={item.badge[index] ?? ""}
                maxLength={20}
                placeholder={`${t("Line")} ${index + 1}`}
                onChange={changeLine}
              />
            );
          })}
        </div>
        <div className="flex flex-col gap-2 grow min-w-0">
          <TextInput
            type="text"
            value={item.title}
            maxLength={60}
            placeholder={t("Title")}
            onChange={(title) => onChange({ title })}
          />
          <textarea
            value={item.description}
            maxLength={160}
            rows={2}
            placeholder={t("Description")}
            className="w-full rounded-md border border-gray-300 p-2 text-sm"
            onChange={(e) => onChange({ description: e.target.value })}
          />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-700">
              {t("Color")}
            </span>
            {BADGE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={color}
                onClick={() => onChange({ color })}
                className={`w-6 h-6 rounded-full border-2 ${
                  getEventCalendarCard(item.color).color === color
                    ? "border-gray-800"
                    : "border-white"
                } shadow`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <GenericButton
            variant="icon"
            title={t("Move Up")}
            disabled={isFirst}
            onClick={() => onMove(-1)}
          >
            ↑
          </GenericButton>
          <GenericButton
            variant="icon"
            title={t("Move Down")}
            disabled={isLast}
            onClick={() => onMove(1)}
          >
            ↓
          </GenericButton>
          <GenericButton
            variant="icon"
            title={t("Delete")}
            className="text-red-500"
            onClick={onRemove}
          >
            <HiOutlineTrash />
          </GenericButton>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-gray-700">{t("Icon")}</span>
        <button
          type="button"
          onClick={() => onChange({ icon: "" })}
          className={`px-2 h-10 rounded-lg border text-xs ${
            item.icon === "" ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
        >
          {t("No Icon")}
        </button>
        {EVENT_CALENDAR_ICON_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange({ icon: key })}
            className={`w-10 h-10 rounded-lg border p-0.5 ${
              item.icon === key
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300"
            }`}
          >
            <img
              src={getEventCalendarIconSrc(key)}
              alt={key}
              className="w-full h-full object-contain"
            />
          </button>
        ))}
        {item.icon && !isPreset && (
          <img
            src={getEventCalendarIconSrc(item.icon)}
            alt="icon"
            className="w-10 h-10 rounded-lg border border-blue-500 bg-blue-50 p-0.5 object-contain"
          />
        )}
        <GenericButton
          variant="outline"
          size="sm"
          isLoading={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {t("Upload Icon")}
        </GenericButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadIcon(file);
          }}
        />
      </div>
    </div>
  );
};

export default EventCalendarRowEditor;
