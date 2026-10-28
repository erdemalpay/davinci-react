import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { PublicFormLoading } from "../components/common/PublicFormCard";
import StatusScreen from "../components/common/StatusScreen";
import MatchesBoard, {
  groupRounds,
} from "../components/tournament/MatchesBoard";
import { StandingsTable } from "../components/tournament/StandingsTab";
import TournamentPodium, {
  podiumOf,
  useFinishConfetti,
} from "../components/tournament/TournamentPodium";
import { useRoundClock } from "../components/tournament/useRoundClock";
import {
  Tournament,
  TournamentMatch,
  TournamentStatus,
} from "../types/tournament";
import { useGetTournamentLive } from "../utils/api/tournament";
import { cleanLogoUrl } from "../utils/logoUrl";
import { normalizeText } from "../utils/slug";

enum LiveTab {
  MATCHES = "matches",
  STANDINGS = "standings",
}

// Panel sayacıyla aynı kalan süre; sayaç yoksa ya da tur bittiyse görünmez
const LiveClock = ({
  tournament,
  roundMatches,
}: {
  tournament: Tournament;
  roundMatches: TournamentMatch[];
}) => {
  const { isActive, isOver, text } = useRoundClock(tournament, roundMatches);
  if (!isActive) return null;
  return (
    <p
      className={`mt-2 text-lg font-semibold tabular-nums ${
        isOver ? "text-red-600" : "text-gray-800"
      }`}
    >
      {text}
    </p>
  );
};

// Oyuncuların eşleşmeleri ve puan tablosunu telefondan takip ettiği sayfa (sadece görüntüleme)
const TournamentLive = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const [afterRound, setAfterRound] = useState<number>();
  const { data, isLoading, isError } = useGetTournamentLive(slug, afterRound);
  const [tab, setTab] = useState(LiveTab.MATCHES);
  const [search, setSearch] = useState("");
  // Geçmiş bir turun tablosuna bakılırken de podyum güncel sonuçtan gelir
  // (tur seçili değilken aynı sorgudur, ayrı istek atılmaz)
  const { data: current } = useGetTournamentLive(slug);
  const finalStandings = current?.standings ?? [];
  const isFinished = data?.tournament.status === TournamentStatus.FINISHED;
  // Sayfa 5 sn'de bir yenilendiği için şampiyon açıklanınca herkesin telefonunda patlar;
  // her cihazda bir kez
  useFinishConfetti(
    isFinished,
    data && `tournament-confetti-${data.tournament._id}`
  );

  const query = normalizeText(search.trim());
  const highlightIds = useMemo(
    () =>
      new Set(
        query.length >= 2
          ? data?.participants
              .filter((p) => normalizeText(p.name).includes(query))
              .map((p) => p._id)
          : []
      ),
    [data, query]
  );

  // Aranan oyuncunun masasına kayar; otomatik yenilemede tekrar kaydırmaz
  useEffect(() => {
    document
      .querySelector("[data-highlighted]")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [query]);

  if (isLoading) return <PublicFormLoading />;

  if (isError || !data) {
    return (
      <StatusScreen
        title={t("Tournament not found")}
        description={t("This link does not belong to a valid tournament.")}
      />
    );
  }

  const { tournament, participants, matches, standings } = data;
  // Adını arayan tek bir oyuncu bulunduysa podyumun altında kendi derecesi yazar
  const ownRank =
    highlightIds.size === 1
      ? finalStandings.find((row) => highlightIds.has(row.participantId))?.rank
      : undefined;
  if (tournament.status === TournamentStatus.NOT_STARTED) {
    return (
      <StatusScreen
        title={t("The tournament has not started yet")}
        description={t("Matches will appear here once the tournament starts.")}
      />
    );
  }

  const names = new Map(participants.map((p) => [p._id, p.name]));
  const rounds = groupRounds(matches);
  const latest = rounds[rounds.length - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="rounded-2xl bg-white p-4 text-center shadow-lg">
          <div className="mb-2 flex items-center justify-center gap-4">
            <img
              src="/logo.svg"
              alt={t("Davinci Board Game Cafe")}
              className="h-14 w-24 object-contain"
            />
            {tournament.secondaryLogoUrl && (
              <img
                src={cleanLogoUrl(tournament.secondaryLogoUrl)}
                alt={tournament.name}
                className="h-14 w-24 object-contain"
              />
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-800">{tournament.name}</h1>
          <p className="text-sm text-gray-500">
            {format(new Date(tournament.date), "dd/MM/yyyy")}
            {tournament.startTime ? ` · ${tournament.startTime}` : ""}
          </p>
          {isFinished ? (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <TournamentPodium podium={podiumOf(finalStandings)} />
              {ownRank && (
                <p className="mt-3 text-sm font-medium text-indigo-700">
                  {t("You finished Nth", { rank: ownRank })}
                </p>
              )}
            </div>
          ) : (
            latest && (
              <LiveClock
                tournament={tournament}
                roundMatches={latest.matches}
              />
            )
          )}
        </div>

        <div className="flex gap-2">
          {[
            { value: LiveTab.MATCHES, label: t("Matches") },
            { value: LiveTab.STANDINGS, label: t("Standings") },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                tab === value
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === LiveTab.MATCHES ? (
          <div className="flex flex-col gap-6 rounded-2xl bg-white p-4 shadow-lg">
            <div>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Type your name to find your table")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              {query.length >= 2 && !highlightIds.size && (
                <p className="mt-1 text-xs text-gray-500">
                  {t("No player found with this name")}
                </p>
              )}
            </div>
            <MatchesBoard
              tournament={tournament}
              matches={matches}
              participants={participants}
              names={names}
              highlightIds={highlightIds}
            />
          </div>
        ) : (
          <StandingsTable
            tournament={tournament}
            standings={standings}
            matches={matches}
            participants={participants}
            afterRound={afterRound}
            setAfterRound={setAfterRound}
          />
        )}
      </div>
    </div>
  );
};

export default TournamentLive;
