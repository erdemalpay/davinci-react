import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BreakTypeEnum } from "../../types";

type Props = {
  onSelect: (type: BreakTypeEnum, note?: string) => void;
  onCancel: () => void;
};

// What the options say when choosing ("I'm going on a break", ...).
const options: { type: BreakTypeEnum; label: string }[] = [
  { type: BreakTypeEnum.BREAK, label: "Break" },
  { type: BreakTypeEnum.RECOMMENDING_GAME, label: "I'm recommending a game" },
  { type: BreakTypeEnum.PREPARING_ORDER, label: "I'm preparing an order" },
  { type: BreakTypeEnum.TAKING_PAYMENT, label: "I'm taking a payment" },
  { type: BreakTypeEnum.WC, label: "WC" },
];

// Picks the busy state (a break is one of them); "Other" needs a note.
export function BusyStateDialog({ onSelect, onCancel }: Props) {
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
        aria-label={t("Why are you busy?")}
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800">
          {t("Why are you busy?")}
        </h3>

        {!isOther ? (
          <div className="flex flex-col gap-2">
            {options.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => onSelect(type)}
                className={`${buttonClass} bg-gray-100 text-gray-800 hover:bg-gray-200`}
              >
                {t(label)}
              </button>
            ))}
            <button
              onClick={() => setIsOther(true)}
              className={`${buttonClass} bg-gray-100 text-gray-800 hover:bg-gray-200`}
            >
              {t("Other")}
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
              onClick={() => onSelect(BreakTypeEnum.OTHER, note.trim())}
              className={`${buttonClass} bg-red-600 text-center text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {t("Mark me busy")}
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
