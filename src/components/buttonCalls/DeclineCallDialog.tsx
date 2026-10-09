import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DeclineReasonEnum, declineReasonLabels } from "../../types";

type Props = {
  tableName: string;
  onDecline: (reason: DeclineReasonEnum, note?: string) => void;
  onCancel: () => void;
};

const listedReasons = [
  DeclineReasonEnum.TAKING_PAYMENT,
  DeclineReasonEnum.RECOMMENDING_GAME,
  DeclineReasonEnum.PREPARING_ORDER,
];

// Asks why the assigned game master can't go. "Other" needs a note; the
// note is only shown to managers in the Call Assignment Log.
export function DeclineCallDialog({ tableName, onDecline, onCancel }: Props) {
  const { t } = useTranslation();
  const [isOther, setIsOther] = useState(false);
  const [note, setNote] = useState("");

  const buttonClass =
    "w-full rounded-lg px-4 py-3 text-left font-medium transition-colors";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("Why can't you go?")}
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-800">
          {t("Why can't you go?")}
        </h3>
        <p className="mb-4 text-sm text-gray-500">
          {t("Table")} {tableName}
        </p>

        {!isOther ? (
          <div className="flex flex-col gap-2">
            {listedReasons.map((reason) => (
              <button
                key={reason}
                onClick={() => onDecline(reason)}
                className={`${buttonClass} bg-gray-100 text-gray-800 hover:bg-gray-200`}
              >
                {t(declineReasonLabels[reason])}
              </button>
            ))}
            <button
              onClick={() => setIsOther(true)}
              className={`${buttonClass} bg-gray-100 text-gray-800 hover:bg-gray-200`}
            >
              {t(declineReasonLabels[DeclineReasonEnum.OTHER])}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <textarea
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder={t("Write a short explanation")}
              aria-label={t("Explanation")}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              disabled={!note.trim()}
              onClick={() => onDecline(DeclineReasonEnum.OTHER, note.trim())}
              className={`${buttonClass} bg-red-600 text-center text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {t("Decline")}
            </button>
          </div>
        )}

        <button
          onClick={onCancel}
          className="mt-3 w-full rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
        >
          {t("Cancel")}
        </button>
      </div>
    </div>
  );
}
