import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { uploadOriginalImage } from "../../../utils/api/asset";
import { GenericButton } from "../../common/GenericButton";

interface Props {
  label: string;
  // Cloudinary klasörü
  folder: string;
  onUploaded: (url: string) => void;
  // Yüklemeden önce dosyayı kontrol eder; hata mesajı dönerse yükleme yapılmaz
  validate?: (file: File) => Promise<string | null>;
  // Resmin indirileceği en fazla genişlik; verilmezse sunucunun varsayılanı (800)
  width?: number;
}

// Etkinlik takvimi editöründeki ikon ve arka plan yükleme butonu
const ImageUploadButton = ({
  label,
  folder,
  onUploaded,
  validate,
  width,
}: Props) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (file: File) => {
    setIsUploading(true);
    try {
      const error = validate ? await validate(file) : null;
      if (error) {
        toast.error(error);
        return;
      }
      onUploaded(await uploadOriginalImage(file, folder, width));
    } catch {
      toast.error(t("Image upload failed"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <GenericButton
        variant="outline"
        size="sm"
        isLoading={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {label}
      </GenericButton>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />
    </>
  );
};

export default ImageUploadButton;
