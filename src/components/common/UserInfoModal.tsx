import { useTranslation } from "react-i18next";

type Props = {
  title: string;
  username: string;
  password: string;
  onClose: () => void;
};

export function UserInfoModal({ title, username, password, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col gap-4 min-w-[320px]">
        <p className="text-green-600 font-semibold text-lg">{title}</p>
        <div className="bg-gray-100 rounded-lg p-4 flex flex-col gap-2">
          <p>
            <span className="font-semibold">{t("Username")}: </span>
            <span className="font-mono">{username}</span>
          </p>
          <p>
            <span className="font-semibold">{t("Password")}: </span>
            <span className="font-mono text-blue-700 text-xl tracking-widest">
              {password}
            </span>
          </p>
        </div>
        <button
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 self-end"
          onClick={onClose}
        >
          {t("OK")}
        </button>
      </div>
    </div>
  );
}
