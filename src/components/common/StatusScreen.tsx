// Herkese açık form sayfalarında (kampanya, turnuva kaydı) bilgi/uyarı ekranı
const StatusScreen = ({
  title,
  description,
  isSuccess = false,
}: {
  title: string;
  description: string;
  isSuccess?: boolean;
}) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center">
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
          isSuccess ? "bg-green-100" : "bg-gray-100"
        }`}
      >
        <svg
          className={`w-8 h-8 ${
            isSuccess ? "text-green-600" : "text-gray-400"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={
              isSuccess
                ? "M5 13l4 4L19 7"
                : "M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            }
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
      <p className="text-sm text-gray-400 mt-1">{description}</p>
    </div>
  </div>
);

export default StatusScreen;
