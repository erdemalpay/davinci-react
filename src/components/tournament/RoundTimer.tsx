import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tournament, TournamentMatch } from "../../types/tournament";
import { useTournamentMutations } from "../../utils/api/tournament";
import { GenericButton } from "../common/GenericButton";
import { WARNING_MS, useRoundClock } from "./useRoundClock";

interface Props {
  tournament: Tournament;
  roundMatches: TournamentMatch[];
}

// Süre dolunca üç kısa bip; ses dosyası gerektirmez
const playAlarm = () => {
  const context = new AudioContext();
  [0, 0.6, 1.2].forEach((offset) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    gain.gain.value = 0.3;
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(context.currentTime + offset);
    oscillator.stop(context.currentTime + offset + 0.4);
  });
  setTimeout(() => context.close(), 2000);
};

// Panelde turun sayacı ve kontrolleri. Skor girmeyi engellemez;
// bütün masalar bitince ya da organizatör "Bitir" deyince kaybolur.
const RoundTimer = ({ tournament, roundMatches }: Props) => {
  const { t } = useTranslation();
  const { updateTournament } = useTournamentMutations();
  const { isActive, pausedAt, remaining, isOver, text } = useRoundClock(
    tournament,
    roundMatches
  );
  const [isAddingTime, setIsAddingTime] = useState(false);
  const [extraMinutes, setExtraMinutes] = useState("");
  const wasOver = useRef<boolean | null>(null);

  // Sadece sayfa açıkken süre dolarsa çalar; sayfa açıldığında zaten dolmuşsa çalmaz
  useEffect(() => {
    if (!isActive) return;
    if (wasOver.current === false && isOver) playAlarm();
    wasOver.current = isOver;
  }, [isActive, isOver]);

  if (!isActive) return null;

  const update = (updates: Partial<Tournament>) =>
    updateTournament({ id: tournament._id, updates });

  const addTime = () => {
    const minutes = Number(extraMinutes);
    if (!minutes || minutes <= 0) return;
    // Süre dolduysa ek süre şu andan başlar, dolmadıysa kalan süreye eklenir
    const overdueMinutes = isOver ? Math.ceil(-remaining / 60000) : 0;
    update({
      roundExtraMinutes:
        (tournament.roundExtraMinutes ?? 0) + overdueMinutes + minutes,
    });
    setIsAddingTime(false);
    setExtraMinutes("");
  };

  const stop = () => update({ isRoundTimerStopped: true });

  const togglePause = () =>
    pausedAt
      ? update({
          roundPausedAt: null,
          roundPausedSeconds:
            (tournament.roundPausedSeconds ?? 0) +
            Math.round((Date.now() - pausedAt) / 1000),
        })
      : update({ roundPausedAt: new Date().toISOString() });

  const colorClass = isOver
    ? "bg-red-50 text-red-700 border-red-200"
    : pausedAt
    ? "bg-blue-50 text-blue-700 border-blue-200"
    : remaining <= WARNING_MS
    ? "bg-orange-50 text-orange-700 border-orange-200"
    : "bg-gray-50 text-gray-800 border-gray-200";

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${colorClass}`}
    >
      <span className="font-semibold tabular-nums">{text}</span>
      <GenericButton size="sm" variant="outline" onClick={togglePause}>
        {t(pausedAt ? "Resume" : "Pause")}
      </GenericButton>
      {isAddingTime ? (
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            addTime();
          }}
        >
          <input
            type="number"
            min={1}
            autoFocus
            className="w-16 border rounded px-2 py-0.5 text-gray-800"
            placeholder={t("min")}
            value={extraMinutes}
            onChange={(e) => setExtraMinutes(e.target.value)}
          />
          <GenericButton size="sm" variant="primary" type="submit">
            {t("Add")}
          </GenericButton>
          <GenericButton
            size="sm"
            variant="ghost"
            onClick={() => setIsAddingTime(false)}
          >
            {t("Cancel")}
          </GenericButton>
        </form>
      ) : (
        <GenericButton
          size="sm"
          variant="outline"
          onClick={() => setIsAddingTime(true)}
        >
          {t("+ Extra Time")}
        </GenericButton>
      )}
      <GenericButton size="sm" variant="ghost" onClick={stop}>
        {t("End Timer")}
      </GenericButton>
    </div>
  );
};

export default RoundTimer;
