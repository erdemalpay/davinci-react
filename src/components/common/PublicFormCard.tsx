import { useTranslation } from "react-i18next";
import logoImage from "../../assets/login/logo.png";

export const PublicFormLoading = () => (
  <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
  </div>
);

interface Props {
  title: string;
  subtitle: React.ReactNode;
  children: React.ReactNode;
  // true: giriş sayfasındaki krem arka plan ve silik logo deseni
  isBrandBackground?: boolean;
}

// Giriş gerektirmeyen formların (kampanya, turnuva kaydı) logolu kart iskeleti
const PublicFormCard = ({
  title,
  subtitle,
  children,
  isBrandBackground = false,
}: Props) => {
  const { t } = useTranslation();
  return (
    <div
      className={`relative min-h-[100dvh] overflow-hidden bg-gradient-to-br flex items-center justify-center p-4 ${
        isBrandBackground
          ? "from-[#f5f5f0] via-[#e8e8dd] to-[#f5f5f0]"
          : "from-blue-50 to-indigo-100"
      }`}
    >
      {isBrandBackground && (
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url(${logoImage})`,
            backgroundRepeat: "repeat",
            backgroundSize: "250px auto",
            backgroundPosition: "-25px 0",
            filter: "grayscale(1) brightness(0.5)",
          }}
        />
      )}
      <div className="relative bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <img
            src="/logo.svg"
            alt={t("Davinci Board Game Cafe")}
            className="h-12 mx-auto mb-3"
          />
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
};

export default PublicFormCard;
