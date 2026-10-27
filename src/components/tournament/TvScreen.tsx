import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PublicRoutes } from "../../navigation/constants";
import {
  MatchStage,
  Tournament,
  TournamentMatch,
  TournamentStanding,
} from "../../types/tournament";
import { GenericButton } from "../common/GenericButton";
import TournamentPodium from "./TournamentPodium";
import { WARNING_MS, formatRemaining, useRoundClock } from "./useRoundClock";
import { useEliminationRoundName } from "./useTournamentForm";

// Oyuncuların eşleşmeleri ve puan tablosunu telefondan takip ettiği sayfa
const tournamentLiveUrl = (slug: string) =>
  `${window.location.origin}${PublicRoutes.TournamentLive.replace(
    ":slug",
    slug
  )}`;

// Tam ekran açmak tarayıcıda kullanıcı tıklaması ister; ekranı açan düğme bunu çağırır
export const requestFullscreen = () =>
  document.documentElement.requestFullscreen?.().catch(() => undefined);

interface Props {
  tournament: Tournament;
  roundMatches: TournamentMatch[];
  eliminationRounds: number;
  podium: TournamentStanding[]; // turnuva bittiyse ilk üç
  close: () => void;
}

// TV'ye yansıtılan ekran: tur sayacı (varsa) ve oyuncuların okutup takip edeceği QR;
// şampiyon açıklanınca podyum ekranı kaplar, QR köşede sonuçlar için kalır
const TvScreen = ({
  tournament,
  roundMatches,
  eliminationRounds,
  podium,
  close,
}: Props) => {
  const { t } = useTranslation();
  const roundName = useEliminationRoundName();
  const { isActive, pausedAt, remaining, isOver } = useRoundClock(
    tournament,
    roundMatches
  );
  const [qr, setQr] = useState("");
  const url = tournamentLiveUrl(tournament.slug);

  useEffect(() => {
    QRCode.toDataURL(url, { width: 600, margin: 1 })
      .then(setQr)
      .catch(() => setQr(""));
  }, [url]);

  // Esc ile tam ekrandan çıkılınca ekran da kapanır
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) close();
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const exit = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    close();
  };

  const roundMatch = roundMatches.find((m) => !m.isBye) ?? roundMatches[0];
  const roundLabel =
    roundMatch &&
    (roundMatch.stage === MatchStage.LEAGUE
      ? t("League Round N", { round: roundMatch.round })
      : roundName(roundMatch.round, eliminationRounds));
  const timeColor = isOver
    ? "text-red-500"
    : pausedAt
    ? "text-blue-300"
    : remaining <= WARNING_MS
    ? "text-orange-400"
    : "text-white";

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-gray-900 p-6 text-center">
      <GenericButton
        className="absolute right-6 top-6"
        variant="secondary"
        onClick={exit}
      >
        {t("Exit Full Screen")}
      </GenericButton>
      <p className="text-3xl font-semibold text-gray-300 md:text-5xl">
        {tournament.name}
      </p>
      {podium.length > 0 ? (
        <>
          <TournamentPodium podium={podium} isLarge />
          {qr && (
            <div className="absolute bottom-6 right-6 flex flex-col items-center gap-2">
              <img
                src={qr}
                alt="QR"
                className="w-[12vw] rounded-lg bg-white p-2"
              />
              <p className="text-lg text-gray-300">
                {t("Scan to see the results")}
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          {roundLabel && (
            <p className="text-2xl text-gray-400 md:text-4xl">{roundLabel}</p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-[6vw]">
            {isActive && (
              <div className="flex flex-col items-center gap-4">
                <p
                  className={`font-bold tabular-nums leading-none ${
                    isOver ? "text-[9vw]" : "text-[16vw]"
                  } ${timeColor}`}
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
            {qr && (
              <div className="flex flex-col items-center gap-4">
                <img
                  src={qr}
                  alt="QR"
                  className={`rounded-xl bg-white p-3 ${
                    isActive ? "w-[26vw]" : "w-[36vw]"
                  } max-w-xl`}
                />
                <p className="text-2xl text-gray-200 md:text-3xl">
                  {t("Scan to follow matches and standings")}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TvScreen;
