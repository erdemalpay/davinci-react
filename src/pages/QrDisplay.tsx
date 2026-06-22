import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/header/Header";
import { useLocationContext } from "../context/Location.context";
import { useGetQrCode } from "../utils/api/visit";

const QrDisplay = () => {
  const { t } = useTranslation();
  const { selectedLocationId } = useLocationContext();
  const { data, isLoading, isError } = useGetQrCode(
    selectedLocationId,
    !!selectedLocationId
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (!data?.code) {
      setQrDataUrl("");
      return;
    }
    QRCode.toDataURL(data.code, {
      width: 420,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [data?.code]);

  return (
    <>
      <Header />
      <div className="w-full px-4 flex flex-col items-center gap-6 my-10">
        <h1 className="text-2xl font-semibold">{t("Cafe Check-in QR")}</h1>
        {isLoading && <p>{t("Loading")}...</p>}
        {isError && <p className="text-red-600">{t("Could not load QR")}</p>}
        {qrDataUrl && (
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-4">
            <img
              src={qrDataUrl}
              alt="QR"
              className="w-[420px] max-w-[80vw] h-auto rounded-lg"
            />
          </div>
        )}
      </div>
    </>
  );
};

export default QrDisplay;
