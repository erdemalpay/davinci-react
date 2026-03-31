import { format } from "date-fns";
import { useState } from "react";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import { Header } from "../components/header/Header";
import { RedeemChannel, RewardCodeStatus, ValidateCodeResult } from "../types/event-survey";
import { redeemCode, validateCode } from "../utils/api/event-survey";
import { useUserContext } from "../context/User.context";

const STATUS_CONFIG: Record<
  RewardCodeStatus,
  { label: string; color: string; bg: string }
> = {
  [RewardCodeStatus.ISSUED]: {
    label: "Kullanılabilir",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
  },
  [RewardCodeStatus.REDEEMED]: {
    label: "Kullanıldı",
    color: "text-gray-600",
    bg: "bg-gray-50 border-gray-200",
  },
  [RewardCodeStatus.EXPIRED]: {
    label: "Süresi Dolmuş",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
  },
};

const SurveyRedeem = () => {
  const { user } = useUserContext();
  const userChannel: RedeemChannel =
    user?.role?.name?.toLowerCase().includes("barista")
      ? RedeemChannel.BARISTA
      : RedeemChannel.GM;

  const [code, setCode] = useState("");
  const [codeInfo, setCodeInfo] = useState<ValidateCodeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState(false);

  const handleValidate = async () => {
    if (code.length !== 6) return;
    setIsLoading(true);
    setError(null);
    setCodeInfo(null);
    setRedeemed(false);
    try {
      const result = await validateCode(code);
      setCodeInfo(result);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Kod bulunamadı."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!codeInfo) return;
    setIsRedeeming(true);
    setError(null);
    try {
      await redeemCode({ code: codeInfo.code, channel: userChannel });
      setRedeemed(true);
      setCodeInfo({ ...codeInfo, status: RewardCodeStatus.REDEEMED });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Kod kullanılamadı."));
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleReset = () => {
    setCode("");
    setCodeInfo(null);
    setError(null);
    setRedeemed(false);
  };

  const statusConfig = codeInfo ? STATUS_CONFIG[codeInfo.status] : null;

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-full max-w-lg mx-auto my-10 px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Kod Doğrulama</h1>

        {/* Kod Giriş Alanı */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            6 Haneli Kod
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setCode(val);
                if (val.length < 6) {
                  setCodeInfo(null);
                  setError(null);
                  setRedeemed(false);
                }
              }}
              placeholder="0000"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-2xl font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              onClick={handleValidate}
              disabled={code.length !== 6 || isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-5 rounded-lg transition-colors"
            >
              {isLoading ? "..." : "Sorgula"}
            </button>
          </div>
        </div>

        {/* Hata */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Kod Bilgileri */}
        {codeInfo && statusConfig && (
          <div className={`rounded-xl border p-5 mb-4 ${statusConfig.bg}`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-bold tracking-widest text-gray-800">
                {codeInfo.code}
              </span>
              <span
                className={`text-sm font-semibold px-3 py-1 rounded-full border ${statusConfig.color} ${statusConfig.bg}`}
              >
                {statusConfig.label}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              {codeInfo.eventName && (
                <InfoRow label="Etkinlik" value={codeInfo.eventName} />
              )}
              {codeInfo.rewardLabel && (
                <InfoRow label="Ödül" value={`🎁 ${codeInfo.rewardLabel}`} />
              )}
              {codeInfo.fullName && (
                <InfoRow label="Müşteri" value={codeInfo.fullName} />
              )}
              <InfoRow
                label="Kodun Alındığı Tarih"
                value={format(new Date(codeInfo.createdAt), "dd/MM/yyyy HH:mm")}
              />
              <InfoRow
                label="Son Kullanım Tarihi"
                value={format(new Date(codeInfo.expiresAt), "dd/MM/yyyy")}
              />
              {codeInfo.eventStartAt && (
                <InfoRow
                  label="Etkinlik Başlangıcı"
                  value={format(new Date(codeInfo.eventStartAt), "dd/MM/yyyy")}
                />
              )}
              {codeInfo.eventEndAt && (
                <InfoRow
                  label="Etkinlik Bitişi"
                  value={format(new Date(codeInfo.eventEndAt), "dd/MM/yyyy")}
                />
              )}
              {codeInfo.redeemedAt && (
                <InfoRow
                  label="Kullanım Zamanı"
                  value={format(new Date(codeInfo.redeemedAt), "dd/MM/yyyy HH:mm")}
                />
              )}
              {codeInfo.redeemedByUserName && (
                <InfoRow
                  label="Teslim Eden"
                  value={codeInfo.redeemedByUserName}
                />
              )}
            </div>

            {/* Redeem Butonu */}
            {codeInfo.status === RewardCodeStatus.ISSUED && !redeemed && (
              <div className="mt-5">
                <button
                  onClick={handleRedeem}
                  disabled={isRedeeming}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg text-base transition-colors"
                >
                  {isRedeeming ? "İşleniyor..." : "✓ Verildi"}
                </button>
              </div>
            )}

            {redeemed && (
              <div className="mt-4 bg-green-100 border border-green-300 rounded-lg p-3 text-center">
                <p className="text-sm font-semibold text-green-700">
                  ✓ Ödül başarıyla teslim edildi
                </p>
              </div>
            )}
          </div>
        )}

        {(codeInfo || error) && (
          <button
            onClick={handleReset}
            className="w-full border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            Yeni Kod Sorgula
          </button>
        )}
      </div>
    </>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-2">
    <span className="text-gray-500 shrink-0">{label}</span>
    <span className="font-medium text-gray-800 text-right">{value}</span>
  </div>
);

export default SurveyRedeem;
