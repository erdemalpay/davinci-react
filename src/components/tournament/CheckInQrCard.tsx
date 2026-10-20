import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  code: string;
  tournamentName: string;
  dateText: string;
  fullName: string;
}

const WIDTH = 720;
const QR_SIZE = 560;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

// Uzun turnuva adı tek satıra sığana kadar yazı küçülür
const fitText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  size: number,
  weight: string,
  color: string
) => {
  let fontSize = size;
  do {
    ctx.font = `${weight} ${fontSize}px Arial, sans-serif`;
    fontSize -= 2;
  } while (ctx.measureText(text).width > WIDTH - 60 && fontSize > 16);
  ctx.fillStyle = color;
  ctx.fillText(text, WIDTH / 2, y);
};

// Galeride neyin QR'ı olduğu anlaşılsın diye turnuva adı, tarih ve kişinin adı resmin üstüne yazılır
const buildQrImage = async ({
  code,
  tournamentName,
  dateText,
  fullName,
}: Props) => {
  const qr = await loadImage(
    await QRCode.toDataURL(code, { width: QR_SIZE, margin: 1 })
  );
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = 900;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  fitText(ctx, tournamentName, 70, 40, "bold", "#1f2937");
  fitText(ctx, dateText, 120, 28, "normal", "#6b7280");
  ctx.drawImage(qr, (WIDTH - QR_SIZE) / 2, 160, QR_SIZE, QR_SIZE);
  fitText(ctx, fullName, 790, 36, "bold", "#1f2937");
  return canvas.toDataURL("image/png");
};

// Telefonda paylaş menüsü açılır ("Resmi Kaydet" ile galeriye gider); desteklemeyen
// tarayıcıda resim indirilir
const saveImage = async (dataUrl: string, fileName: string) => {
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], fileName, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] }).catch(() => undefined);
    return;
  }
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
};

const CheckInQrCard = (props: Props) => {
  const { t } = useTranslation();
  const [image, setImage] = useState("");

  useEffect(() => {
    buildQrImage(props)
      .then(setImage)
      .catch(() => setImage(""));
  }, [props.code, props.tournamentName, props.dateText, props.fullName]);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-sm text-gray-600">{t("CheckInQrDescription")}</p>
      {image && (
        <img
          src={image}
          alt="QR"
          className="w-full max-w-xs rounded-lg border border-gray-200"
        />
      )}
      <button
        type="button"
        disabled={!image}
        onClick={() => saveImage(image, `${props.tournamentName}-QR.png`)}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
      >
        {t("Save QR to Gallery")}
      </button>
      <p className="text-xs text-gray-500">
        {t("The same QR was sent to your email")}
      </p>
    </div>
  );
};

export default CheckInQrCard;
