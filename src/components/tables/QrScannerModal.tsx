import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useQrCheckInOutMutation } from "../../utils/api/visit";

interface QrScannerModalProps {
  isOpen: boolean;
  close: () => void;
}

export const QrScannerModal = ({ isOpen, close }: QrScannerModalProps) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const submittingRef = useRef(false);
  const [error, setError] = useState<string>("");
  const { mutate: qrCheckInOut } = useQrCheckInOutMutation();

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    submittingRef.current = false;

    // Kamera (getUserMedia) yalnızca güvenli bağlamda çalışır: HTTPS veya localhost.
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError(t("Camera requires a secure (HTTPS) connection"));
      return;
    }

    const videoEl = videoRef.current;
    if (!videoEl) return;

    const reader = new BrowserQRCodeReader();
    let cancelled = false;

    reader
      .decodeFromConstraints(
        { video: { facingMode: "environment" } }, //arka kamera
        videoEl,
        (result) => {
          if (!result || submittingRef.current) return;
          submittingRef.current = true; // çoklu callback'te tek istek garantisi
          qrCheckInOut(result.getText(), {
            onSuccess: (data) => {
              toast.success(
                data.action === "entry"
                  ? t("Check-in successful")
                  : t("Check-out successful")
              );
              close();
            },
            onError: () => {
              // Hata toast'ı useQrCheckInOutMutation'ın onError'ında gösterilir
              // (proje pattern'i). Burada sadece yeniden okutmaya izin veriyoruz.
              submittingRef.current = false;
            },
          });
        }
      )
      .then((controls) => {
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      })
      .catch(() => setError(t("Camera access denied or unavailable")));

    return () => {
      cancelled = true;
      controlsRef.current?.stop(); // kamera akışını durdurur (stream/memory leak yok)
      controlsRef.current = null;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 w-[90%] max-w-md mx-4 shadow-2xl flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {t("Scan QR to check in/out")}
          </h2>
          <button
            onClick={close}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ✕
          </button>
        </div>
        {error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : (
          <video
            ref={videoRef}
            className="w-full rounded-xl bg-black aspect-square object-cover"
            muted
            playsInline
          />
        )}
        <p className="text-xs text-gray-500 text-center">
          {t("Point your camera at the QR shown at the cafe")}
        </p>
      </div>
    </div>
  );
};
