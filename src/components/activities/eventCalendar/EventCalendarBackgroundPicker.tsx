import { useTranslation } from "react-i18next";
import { useGetFolderImages } from "../../../utils/api/asset";
import { EVENT_CALENDAR_BACKGROUND_FOLDER } from "../../../utils/api/eventCalendar";
import { POSTER_BACKGROUND_URL } from "../../../utils/eventCalendarAssets";
import {
  isPosterRatio,
  POSTER_WIDTH,
} from "../../../utils/eventCalendarPoster";
import { loadImage } from "../../../utils/loadImage";
import ImageUploadButton from "./ImageUploadButton";

interface Props {
  // Seçili arka planın adresi; boş = varsayılan resim
  value: string;
  onChange: (background: string) => void;
}

const thumbClass = (isSelected: boolean) =>
  `w-16 aspect-[4/5] rounded-lg border-2 overflow-hidden ${
    isSelected ? "border-blue-500" : "border-gray-300"
  }`;

const EventCalendarBackgroundPicker = ({ value, onChange }: Props) => {
  const { t } = useTranslation();
  const folderImages = useGetFolderImages(EVENT_CALENDAR_BACKGROUND_FOLDER);
  // Cloudinary araması yeni yüklemeyi birkaç saniye geç listeleyebilir; seçili resim yine görünsün
  const urls = folderImages.map(({ url }) => url);
  if (value && !urls.includes(value)) urls.unshift(value);

  // Sadece afişe yakın oranlı dikey resimler yüklenir
  const validateRatio = async (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const image = await loadImage(objectUrl);
    URL.revokeObjectURL(objectUrl);
    return image && isPosterRatio(image.width, image.height)
      ? null
      : t("EventCalendarBackgroundRatioError");
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-700">
        {t("Background")}
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          title={t("Default")}
          onClick={() => onChange("")}
          className={thumbClass(value === "")}
        >
          <img
            src={POSTER_BACKGROUND_URL}
            alt={t("Default")}
            className="w-full h-full object-cover"
          />
        </button>
        {urls.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => onChange(url)}
            className={thumbClass(value === url)}
          >
            <img
              src={url}
              alt={t("Background")}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
        <ImageUploadButton
          label={t("Upload Background")}
          folder={EVENT_CALENDAR_BACKGROUND_FOLDER}
          onUploaded={onChange}
          validate={validateRatio}
          width={POSTER_WIDTH}
        />
      </div>
      <p className="text-xs text-gray-500">
        {t("EventCalendarBackgroundHint")}
      </p>
    </div>
  );
};

export default EventCalendarBackgroundPicker;
