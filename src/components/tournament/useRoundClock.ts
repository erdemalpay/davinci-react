import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Tournament,
  TournamentMatch,
  TournamentStatus,
} from "../../types/tournament";

// Kalan süre bu kadar azalınca sayaç uyarı rengine döner
export const WARNING_MS = 5 * 60 * 1000;

export const formatRemaining = (ms: number) => {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

// O anki turun geri sayımı: tur oluşturulduğu an başlar; bütün masalar bitince ya da
// organizatör "Bitir" deyince durur. Panel sayacı, TV ekranı ve takip sayfası aynı hesabı kullanır.
export const useRoundClock = (
  tournament: Tournament,
  roundMatches: TournamentMatch[]
) => {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now());

  const playing = roundMatches.filter((m) => !m.isBye);
  const startedAt = Math.min(
    ...playing.map((m) => new Date(m.createdAt ?? 0).getTime())
  );
  const isActive =
    Boolean(tournament.roundDuration) &&
    tournament.status === TournamentStatus.ONGOING &&
    !tournament.isRoundTimerStopped &&
    playing.some((m) => !m.isCompleted) &&
    Boolean(startedAt);
  const pausedAt = tournament.roundPausedAt
    ? new Date(tournament.roundPausedAt).getTime()
    : null;
  const totalMinutes =
    (tournament.roundDuration ?? 0) + (tournament.roundExtraMinutes ?? 0);
  // Tarayıcı saati sunucudan birkaç saniye geride olabilir; sayaç girilen süreyi aşmasın
  const elapsed = Math.max(
    0,
    (pausedAt ?? now) - startedAt - (tournament.roundPausedSeconds ?? 0) * 1000
  );
  const remaining = totalMinutes * 60 * 1000 - elapsed;

  useEffect(() => {
    if (!isActive || pausedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isActive, pausedAt]);

  const isOver = remaining <= 0;
  const text = isOver
    ? t("Time is up")
    : t(pausedAt ? "Paused at" : "Time left", {
        time: formatRemaining(remaining),
      });

  return { isActive, pausedAt, remaining, isOver, text };
};
