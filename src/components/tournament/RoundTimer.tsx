import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MatchStage,
  Tournament,
  TournamentMatch,
  TournamentStatus,
} from "../../types/tournament";
import { useTournamentMutations } from "../../utils/api/tournament";
import { GenericButton } from "../common/GenericButton";

interface Props {
  tournament: Tournament;
  roundMatches: TournamentMatch[];
}

const WARNING_MS = 5 * 60 * 1000;

const formatRemaining = (ms: number) => {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

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

// O anki turun geri sayımı: tur oluşturulduğu an başlar. Skor girmeyi engellemez;
// bütün masalar bitince ya da organizatör "Bitir" deyince kaybolur.
const RoundTimer = ({ tournament, roundMatches }: Props) => {
  const { t } = useTranslation();
  const { updateTournament } = useTournamentMutations();
  const [now, setNow] = useState(Date.now());
  const [isAddingTime, setIsAddingTime] = useState(false);
  const [extraMinutes, setExtraMinutes] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wasOver = useRef<boolean | null>(null);

  const playing = roundMatches.filter((m) => !m.isBye);
  const isActive =
    Boolean(tournament.roundDuration) &&
    tournament.status === TournamentStatus.ONGOING &&
    !tournament.isRoundTimerStopped &&
    playing.some((m) => !m.isCompleted);
  const startedAt = Math.min(
    ...playing.map((m) => new Date(m.createdAt ?? 0).getTime())
  );
  const pausedAt = tournament.roundPausedAt
    ? new Date(tournament.roundPausedAt).getTime()
    : null;
  const totalMinutes =
    (tournament.roundDuration ?? 0) + (tournament.roundExtraMinutes ?? 0);
  // Tarayıcı saati sunucudan birkaç saniye geride olabilir; sayaç girilen süreyi aşmasın
  const elapsed = Math.max(
    0,
    (pausedAt ?? now) -
      startedAt -
      (tournament.roundPausedSeconds ?? 0) * 1000
  );
  const remaining = totalMinutes * 60 * 1000 - elapsed;
  const isOver = remaining <= 0;

  useEffect(() => {
    if (!isActive || pausedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isActive, pausedAt]);

  // Sadece sayfa açıkken süre dolarsa çalar; sayfa açıldığında zaten dolmuşsa çalmaz
  useEffect(() => {
    if (!isActive) return;
    if (wasOver.current === false && isOver) playAlarm();
    wasOver.current = isOver;
  }, [isActive, isOver]);

  // Esc ile tam ekrandan çıkılınca büyük sayaç da kapanır
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  if (!isActive || !startedAt) return null;

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

  const openFullscreen = () => {
    setIsFullscreen(true);
    document.documentElement.requestFullscreen?.().catch(() => undefined);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    if (document.fullscreenElement) document.exitFullscreen();
  };

  const timeText = isOver
    ? t("Time is up")
    : t(pausedAt ? "Paused at" : "Time left", {
        time: formatRemaining(remaining),
      });
  const roundMatch = playing[0];
  const roundLabel =
    roundMatch.stage === MatchStage.LEAGUE
      ? t("League Round N", { round: roundMatch.round })
      : t("Elimination Round N", { round: roundMatch.round });

  const colorClass = isOver
    ? "bg-red-50 text-red-700 border-red-200"
    : pausedAt
    ? "bg-blue-50 text-blue-700 border-blue-200"
    : remaining <= WARNING_MS
    ? "bg-orange-50 text-orange-700 border-orange-200"
    : "bg-gray-50 text-gray-800 border-gray-200";
  const fullscreenColor = isOver
    ? "text-red-500"
    : pausedAt
    ? "text-blue-300"
    : remaining <= WARNING_MS
    ? "text-orange-400"
    : "text-white";

  return (
    <>
      <div
        className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${colorClass}`}
      >
        <span className="font-semibold tabular-nums">{timeText}</span>
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
        <GenericButton size="sm" variant="outline" onClick={openFullscreen}>
          {t("Show On Screen")}
        </GenericButton>
        <GenericButton size="sm" variant="ghost" onClick={stop}>
          {t("End Timer")}
        </GenericButton>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-gray-900 p-6 text-center">
          <GenericButton
            className="absolute right-6 top-6"
            variant="secondary"
            onClick={closeFullscreen}
          >
            {t("Exit Full Screen")}
          </GenericButton>
          <p className="text-3xl font-semibold text-gray-300 md:text-5xl">
            {tournament.name}
          </p>
          <p className="text-2xl text-gray-400 md:text-4xl">{roundLabel}</p>
          <p
            className={`font-bold tabular-nums leading-none ${
              isOver ? "text-[12vw]" : "text-[22vw]"
            } ${fullscreenColor}`}
          >
            {isOver ? t("Time Up") : formatRemaining(remaining)}
          </p>
          {pausedAt && !isOver && (
            <p className="text-3xl font-semibold text-blue-300">
              {t("Paused")}
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default RoundTimer;
