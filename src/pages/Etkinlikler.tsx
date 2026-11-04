import { useTranslation } from "react-i18next";
import PublicFormCard, {
  PublicFormLoading,
} from "../components/common/PublicFormCard";
import { RegistrationSource } from "../types/tournament";
import {
  useGetOpenTournaments,
  useGetPublicEventQrButton,
} from "../utils/api/eventQr";
import { registrationUrl } from "../utils/registrationUrl";

// Turnuva ve ek etkinlik butonları aynı boyut ve stilde
const buttonClass =
  "block w-full rounded-2xl bg-blue-600 px-5 py-5 text-center text-lg font-bold text-white shadow-md hover:bg-blue-700";

// Kasadaki QR'ın açtığı sayfa: kaydı açık turnuvalar + panelden tanımlanan ek buton
const Etkinlikler = () => {
  const { t } = useTranslation();
  const tournaments = useGetOpenTournaments();
  const extraButton = useGetPublicEventQrButton();

  if (tournaments === undefined || extraButton === undefined)
    return <PublicFormLoading />;

  return (
    <PublicFormCard
      title={t("Welcome")}
      subtitle={t("Choose the event you want to join")}
      isBrandBackground
    >
      <div className="flex flex-col gap-4">
        {tournaments.map((tournament) => (
          <a
            key={tournament._id}
            href={registrationUrl(tournament.slug, RegistrationSource.QR)}
            className={buttonClass}
          >
            {tournament.name}
          </a>
        ))}
        {extraButton ? (
          <a href={extraButton.url} className={buttonClass}>
            {extraButton.title}
          </a>
        ) : null}
      </div>
    </PublicFormCard>
  );
};

export default Etkinlikler;
