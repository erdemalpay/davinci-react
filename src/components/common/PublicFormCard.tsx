import { useTranslation } from "react-i18next";

export const PublicFormLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
  </div>
);

interface Props {
  title: string;
  subtitle: React.ReactNode;
  children: React.ReactNode;
}

// Giriş gerektirmeyen formların (kampanya, turnuva kaydı) logolu kart iskeleti
const PublicFormCard = ({ title, subtitle, children }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
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
