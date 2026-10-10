import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DeclineReasonEnum, declineReasonLabels } from "../../types";
import { MinimalGame } from "../../utils/api/game";

type Props = {
  tableName: string;
  // The game the call is about (explanation calls); undefined otherwise.
  game?: number;
  games: MinimalGame[];
  // "I don't know the game" only makes sense for game master calls.
  canNotKnowGame?: boolean;
  onDecline: (reason: DeclineReasonEnum, note?: string, game?: number) => void;
  onCancel: () => void;
};

const listedReasons = [
  DeclineReasonEnum.TAKING_PAYMENT,
  DeclineReasonEnum.RECOMMENDING_GAME,
  DeclineReasonEnum.PREPARING_ORDER,
];

const MAX_GAME_RESULTS = 20;

// Asks why the assigned game master can't go. "I don't know the game" asks
// which game the table needs help with (the call's game preselected, but it
// can be changed); "Other" needs a note. Notes are only shown to managers in
// the Call Assignment Log.
export function DeclineCallDialog({
  tableName,
  game,
  games,
  canNotKnowGame = true,
  onDecline,
  onCancel,
}: Props) {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<"reasons" | "other" | "game">("reasons");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  // The game the table needs help with: the call's game to start with, which
  // the game master can change; empty when the call names none.
  const [selectedGame, setSelectedGame] = useState<number | undefined>(game);
  const selectedGameName = games.find((g) => g._id === selectedGame)?.name;

  const gameResults = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(i18n.language);
    if (!query) return [];
    return games
      .filter((g) => g.name.toLocaleLowerCase(i18n.language).includes(query))
      .slice(0, MAX_GAME_RESULTS);
  }, [games, search, i18n.language]);

  const buttonClass =
    "w-full rounded-lg px-4 py-3 text-left font-medium transition-colors";
  const optionClass = `${buttonClass} bg-gray-100 text-gray-800 hover:bg-gray-200`;

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
          {step === "game"
            ? t("Which game does the table need help with?")
            : t("Why can't you go?")}
        </h3>
        <p className="mb-4 text-sm text-gray-500">
          {t("Table")} {tableName}
        </p>

        {step === "reasons" && (
          <div className="flex flex-col gap-2">
            {listedReasons.map((reason) => (
              <button
                key={reason}
                onClick={() => onDecline(reason)}
                className={optionClass}
              >
                {t(declineReasonLabels[reason])}
              </button>
            ))}
            {canNotKnowGame && (
              <button onClick={() => setStep("game")} className={optionClass}>
                {t(declineReasonLabels[DeclineReasonEnum.DOESNT_KNOW_GAME])}
              </button>
            )}
            <button onClick={() => setStep("other")} className={optionClass}>
              {t(declineReasonLabels[DeclineReasonEnum.OTHER])}
            </button>
          </div>
        )}

        {step === "other" && (
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

        {step === "game" && (
          <div className="flex flex-col gap-2">
            {selectedGameName && (
              <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-blue-900">
                <span className="font-semibold">{selectedGameName}</span>
                <button
                  onClick={() => setSelectedGame(undefined)}
                  className="text-sm text-blue-700 underline"
                >
                  {t("Change game")}
                </button>
              </div>
            )}
            {!selectedGameName && (
              <>
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("Search for a game")}
                  aria-label={t("Search for a game")}
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
                />
                <ul className="max-h-60 overflow-y-auto">
                  {gameResults.map((g) => (
                    <li key={g._id}>
                      <button
                        onClick={() => {
                          setSelectedGame(g._id);
                          setSearch("");
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-gray-800 hover:bg-gray-100"
                      >
                        {g.name}
                      </button>
                    </li>
                  ))}
                </ul>
                {search.trim() && gameResults.length === 0 && (
                  <p className="text-center text-sm text-gray-500">
                    {t("No game found")}
                  </p>
                )}
              </>
            )}
            <button
              disabled={selectedGame === undefined}
              onClick={() =>
                onDecline(
                  DeclineReasonEnum.DOESNT_KNOW_GAME,
                  undefined,
                  selectedGame
                )
              }
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
