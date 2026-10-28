import { format } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import PublicFormCard, {
  PublicFormLoading,
} from "../components/common/PublicFormCard";
import StatusScreen from "../components/common/StatusScreen";
import CheckInQrCard from "../components/tournament/CheckInQrCard";
import { RegistrationSource } from "../types/tournament";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import {
  registerTournament,
  useGetPublicTournament,
} from "../utils/api/tournament";

const inputClassName =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300";

// Linkteki ?source= değeri tanınmıyorsa "other" olarak kaydedilir
const parseSource = (value: string | null) =>
  Object.values(RegistrationSource).includes(value as RegistrationSource)
    ? (value as RegistrationSource)
    : RegistrationSource.OTHER;

const TournamentRegister = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { data: tournament, isLoading, isError } = useGetPublicTournament(slug);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  // Kayıt olunca dolar; turnuva günü girişte okutulacak QR'ın içeriği (eski API'de boş)
  const [checkInCode, setCheckInCode] = useState<string>();
  // Kontenjanlı turnuvada "Asil" / "Yedek 3"; not asilde asil, yedekte yedek bilgisidir.
  // Not doluysa kutuda yalnızca o gösterilir, boşsa otomatik cümle çıkar
  const [registrationStatus, setRegistrationStatus] = useState<string>();
  const [waitlistNumber, setWaitlistNumber] = useState<number>();
  const [registrationNote, setRegistrationNote] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!slug) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const registration = await registerTournament(slug, {
        fullName: fullName.trim(),
        phone,
        email: email.trim(),
        source: parseSource(searchParams.get("source")),
      });
      setRegistrationStatus(registration.registrationStatus);
      setWaitlistNumber(registration.waitlistNumber);
      setRegistrationNote(registration.registrationNote);
      setCheckInCode(registration.checkInCode ?? "");
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          t("An unexpected error occurred, please try again.")
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <PublicFormLoading />;
  }

  if (isError || !tournament) {
    return (
      <StatusScreen
        title={t("Tournament not found")}
        description={t("This link does not belong to a valid tournament.")}
      />
    );
  }

  const dateText = `${format(new Date(tournament.date), "dd/MM/yyyy")}${
    tournament.startTime ? ` · ${tournament.startTime}` : ""
  }`;

  if (checkInCode !== undefined) {
    return (
      <PublicFormCard
        title={t("Your registration has been received!")}
        subtitle={t("TournamentRegisteredDescription", {
          name: tournament.name,
        })}
      >
        {registrationStatus && (
          <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm text-gray-700">
            {registrationNote ? (
              <>
                <p className="whitespace-pre-line">{registrationNote}</p>
                {waitlistNumber && (
                  <p className="mt-2 font-semibold text-indigo-700">
                    {t("WaitlistPosition", { number: waitlistNumber })}
                  </p>
                )}
              </>
            ) : (
              <p>
                {t("RegistrationThanks", { name: tournament.name })}{" "}
                <span className="font-semibold text-indigo-700">
                  {waitlistNumber
                    ? t("YouAreOnWaitlist", { number: waitlistNumber })
                    : t("YouAreInMainList")}
                </span>
              </p>
            )}
          </div>
        )}
        {checkInCode && (
          <CheckInQrCard
            code={checkInCode}
            tournamentName={tournament.name}
            dateText={dateText}
            fullName={fullName.trim()}
          />
        )}
      </PublicFormCard>
    );
  }

  if (!tournament.isRegistrationOpen) {
    return (
      <StatusScreen
        title={t("Registration is closed")}
        description={t("Registration for this tournament has closed.")}
      />
    );
  }

  return (
    <PublicFormCard
      title={tournament.name}
      subtitle={`${dateText} · ${t("Davinci Board Game Cafe")}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("Full Name")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t("Enter full name")}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("Phone")} <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            pattern="[0-9 +()-]{10,}"
            title={t("Enter a valid phone number")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05XX XXX XX XX"
            className={inputClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("Email")} <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("example@email.com")}
            className={inputClassName}
          />
        </div>

        {tournament.participationNote && (
          <p className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-gray-700 whitespace-pre-line">
            {tournament.participationNote}
          </p>
        )}

        <div className="space-y-1">
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              required
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300"
            />
            <span>{t("TournamentPrivacyRead")}</span>
          </label>
          <button
            type="button"
            onClick={() => setShowPrivacyNotice((shown) => !shown)}
            className="text-xs text-indigo-600 hover:underline"
          >
            {showPrivacyNotice
              ? t("TournamentPrivacyHide")
              : t("TournamentPrivacyShow")}
          </button>
          {showPrivacyNotice && (
            <p className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600 whitespace-pre-line">
              {t("TournamentPrivacyNotice")}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
        >
          {isSubmitting ? t("processing") : t("Join Tournament")}
        </button>
      </form>
    </PublicFormCard>
  );
};

export default TournamentRegister;
