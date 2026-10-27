import confetti from "canvas-confetti";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaCrown, FaMedal } from "react-icons/fa";
import { TournamentStanding } from "../../types/tournament";

// Taç sarısı ve panelin mavi/indigo tonları
const CONFETTI_COLORS = ["#f59e0b", "#fbbf24", "#4f46e5", "#3b82f6"];
const CONFETTI_MS = 3000;

// Ekranın iki alt köşesinden ~3 sn konfeti; "hareketi azalt" açık cihazlarda patlamaz
const fireConfetti = () => {
  const end = Date.now() + CONFETTI_MS;
  const frame = () => {
    [
      { angle: 60, x: 0 },
      { angle: 120, x: 1 },
    ].forEach(({ angle, x }) =>
      confetti({
        particleCount: 4,
        angle,
        spread: 60,
        origin: { x, y: 0.8 },
        colors: CONFETTI_COLORS,
        disableForReducedMotion: true,
        zIndex: 10000, // tam ekran TV görünümünün de üstünde
      })
    );
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
};

// Turnuva bitince konfeti patlatır. onceKey verilirse cihazda bir kez patlar (bittikten sonra
// açan da görür); verilmezse yalnızca sayfa açıkken bitiş anında patlar.
export const useFinishConfetti = (isFinished: boolean, onceKey?: string) => {
  const wasFinished = useRef(isFinished);
  useEffect(() => {
    const justFinished = isFinished && !wasFinished.current;
    wasFinished.current = isFinished;
    if (!isFinished) return;
    if (onceKey) {
      try {
        if (localStorage.getItem(onceKey)) return;
        localStorage.setItem(onceKey, "1");
      } catch {
        // Gizli sekmede depolama kapalı olabilir; konfeti yine patlar
      }
    } else if (!justFinished) return;
    fireConfetti();
  }, [isFinished, onceKey]);
};

// Genel sıralamanın ilk üçü (eleme varsa final masasının sonucu)
export const podiumOf = (standings: TournamentStanding[]) =>
  standings.filter((row) => row.rank <= 3).sort((a, b) => a.rank - b.rank);

interface Props {
  podium: TournamentStanding[];
  isLarge?: boolean; // koyu zeminli TV ekranı için büyük yazı
}

const MEDAL_COLORS: Record<number, string> = {
  2: "text-gray-400",
  3: "text-amber-700",
};

const SIZES = {
  normal: {
    crown: "text-5xl",
    label: "text-sm text-amber-700",
    name: "text-3xl text-gray-900",
    others: "mt-3 pt-3 text-sm text-gray-700 border-amber-100",
  },
  large: {
    crown: "text-[7vw]",
    label: "text-3xl md:text-4xl text-amber-400",
    name: "text-[9vw] leading-none text-white",
    others: "mt-8 pt-6 text-2xl md:text-4xl text-gray-200 border-gray-700",
  },
};

// Şampiyon büyük ve ortada, 2. ve 3. altında; çerçeveyi kullanan sayfa verir
const TournamentPodium = ({ podium, isLarge }: Props) => {
  const { t } = useTranslation();
  const champions = podium.filter((row) => row.rank === 1);
  const others = podium.filter((row) => row.rank > 1);
  if (!champions.length) return null;
  const size = isLarge ? SIZES.large : SIZES.normal;

  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <FaCrown className={`${size.crown} text-amber-500`} />
      <p className={`${size.label} font-semibold tracking-wide`}>
        {t("Champion")}
      </p>
      {champions.map((row) => (
        <p key={row.participantId} className={`${size.name} font-bold`}>
          {row.name}
        </p>
      ))}
      {others.length > 0 && (
        <div
          className={`${size.others} flex flex-wrap justify-center gap-x-6 gap-y-1 border-t`}
        >
          {others.map((row) => (
            <span key={row.participantId} className="flex items-center gap-1.5">
              <FaMedal className={MEDAL_COLORS[row.rank]} />
              <span className="font-semibold">{row.rank}.</span>
              {row.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TournamentPodium;
