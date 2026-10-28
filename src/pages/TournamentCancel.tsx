import { format } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import PublicFormCard, {
  PublicFormLoading,
} from "../components/common/PublicFormCard";
import StatusScreen from "../components/common/StatusScreen";
import { PublicRegistration } from "../types/tournament";
import {
  declineRegistration,
  useGetPublicRegistration,
} from "../utils/api/tournament";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

// Kayıt mailindeki "Katılamayacağım" linki: kişi kaydını iptal eder, panelde "Gelmeyecek
// (Linkten)" görünür; yeri görevli yedek listesini güncelleyince sıradakine verilir
const TournamentCancel = () => {
  const { t } = useTranslation();
  const { code } = useParams<{ code: string }>();
  const { data, isLoading, isError } = useGetPublicRegistration(code);
  const [declined, setDeclined] = useState<PublicRegistration>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <PublicFormLoading />;

  const registration = declined ?? data;
  if (isError || !registration) {
    return (
      <StatusScreen
        title={t("Registration not found")}
        description={t("This link does not belong to a valid registration.")}
      />
    );
  }

  if (registration.isDeclined) {
    return (
      <StatusScreen
        isSuccess
        title={t("Your registration has been cancelled")}
        description={t("RegistrationCancelledDescription", {
          name: registration.tournamentName,
        })}
      />
    );
  }

  if (!registration.canDecline) {
    return (
      <StatusScreen
        title={t("Cancellation period has ended")}
        description={t("CancellationEndedDescription")}
      />
    );
  }

  const decline = async () => {
    if (!code) return;
    setIsDialogOpen(false);
    setError(null);
    setIsSubmitting(true);
    try {
      setDeclined(await declineRegistration(code));
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

  return (
    <PublicFormCard
      title={registration.tournamentName}
      subtitle={`${format(new Date(registration.date), "dd/MM/yyyy")}${
        registration.startTime ? ` · ${registration.startTime}` : ""
      }`}
    >
      <div className="space-y-4 text-sm text-gray-700">
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
          <p className="font-medium text-gray-800">{registration.fullName}</p>
          {registration.registrationStatus && (
            <p>
              {t("Registration status")}:{" "}
              <span className="font-semibold text-indigo-700">
                {registration.registrationStatus}
              </span>
            </p>
          )}
        </div>
        <p>{t("CancelRegistrationDescription")}</p>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => setIsDialogOpen(true)}
          className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {t("I won't attend, cancel my registration")}
        </button>
      </div>
      <ConfirmationDialog
        isOpen={isDialogOpen}
        close={() => setIsDialogOpen(false)}
        confirm={decline}
        title={t("Cancel Registration")}
        text={t("CancelRegistrationConfirm")}
        cancelLabel={t("Go Back")}
        confirmLabel={t("Yes, Cancel")}
      />
    </PublicFormCard>
  );
};

export default TournamentCancel;
