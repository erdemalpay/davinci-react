import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCrown, FaMedal } from "react-icons/fa";
import {
  MatchStage,
  Tournament,
  TournamentMatch,
  TournamentStatus,
} from "../../types/tournament";
import {
  autoRules,
  eliminationSize,
  eliminationTables,
  useEliminationRoundName,
} from "./useTournamentForm";
import { TieBreakPicker, useScoreEntry } from "./useScoreEntry";
import { GenericButton } from "../common/GenericButton";

interface Props {
  tournament: Tournament;
  matches: TournamentMatch[];
  names: Map<number, string>;
  editableRound?: number; // skoru girilebilen (son) eleme turu
}

type BracketTable = {
  key: string;
  tableNo: number;
  isThirdPlace?: boolean;
  match?: TournamentMatch; // henüz oynanmayan turlarda boş kutu
};

type Column = { round: number; tables: BracketTable[] };

// Oynanan eleme turlarına, henüz kurulmamış turları boş kutu olarak ekler (Challonge gibi)
export const buildColumns = (
  tournament: Tournament,
  elimination: TournamentMatch[]
): Column[] => {
  const byRound = new Map<number, TournamentMatch[]>();
  elimination.forEach((match) =>
    byRound.set(match.round, [...(byRound.get(match.round) ?? []), match])
  );
  const columns: Column[] = Array.from(byRound.entries())
    .sort(([a], [b]) => a - b)
    .map(([round, roundMatches]) => ({
      round,
      tables: roundMatches
        .sort((a, b) => a.tableNo - b.tableNo)
        .map((match) => ({
          key: match.isBye
            ? `${round}-bye-${match.players[0]?.participantId}`
            : `${round}-${match.tableNo}`,
          tableNo: match.tableNo,
          isThirdPlace: match.isThirdPlace,
          match,
        })),
    }));

  const last = columns[columns.length - 1];
  if (!last || last.tables.filter((t) => !t.isThirdPlace).length === 1)
    return columns;
  const tableSize = eliminationSize(tournament);
  const perTable =
    tournament.advancePerTable ?? autoRules(tableSize).advancePerTable;
  // Bay geçen doğrudan çıkar, masadan ilk `perTable` kişi çıkar (en az biri elenir)
  const advancing = last.tables.reduce((sum, table) => {
    const seated = table.match?.players.length ?? 0;
    return sum + (seated === 1 ? 1 : Math.min(perTable, seated - 1));
  }, 0);
  const upcoming = eliminationTables(advancing, tableSize, perTable);
  upcoming.forEach((count, i) => {
    const round = last.round + i + 1;
    const tables: BracketTable[] = Array.from({ length: count }, (_, n) => ({
      key: `${round}-${n + 1}`,
      tableNo: n + 1,
    }));
    if (i === upcoming.length - 1 && tournament.thirdPlaceMatch)
      tables.push({ key: `${round}-third`, tableNo: 2, isThirdPlace: true });
    columns.push({ round, tables });
  });
  return columns;
};

// Bir masadan çıkanların bir sonraki turda oturduğu masalar; tur kurulmadıysa sıraya göre
// dağıtılır. 3.'lük masasına çizgi çekilmez (Challonge'daki gibi ayrı durur).
const targetsOf = (
  table: BracketTable,
  index: number,
  current: Column,
  next: Column
) => {
  const nextTables = next.tables.filter((t) => !t.isThirdPlace);
  const nextIds = new Map<number, string>();
  nextTables.forEach((t) =>
    t.match?.players.forEach((p) => nextIds.set(p.participantId, t.key))
  );
  const targets = new Set<string>();
  table.match?.players.forEach((p) => {
    const key = nextIds.get(p.participantId);
    if (key) targets.add(key);
  });
  if (!targets.size) {
    const slot = Math.floor(
      (index * nextTables.length) / current.tables.length
    );
    targets.add(nextTables[slot].key);
  }
  return Array.from(targets);
};

interface BracketBoxProps {
  table: BracketTable;
  names: Map<number, string>;
  isEditable: boolean;
  isChampionTable: boolean;
  isAdvancer: (participantId: number) => boolean | undefined;
  boxRef: (el: HTMLDivElement | null) => void;
}

// Ağaçtaki tek masa kutusu; son turda skorlar doğrudan isimlerin yanına girilir
const BracketBox = ({
  table,
  names,
  isEditable,
  isChampionTable,
  isAdvancer,
  boxRef,
}: BracketBoxProps) => {
  const { t } = useTranslation();
  const { match } = table;
  const players = match?.isCompleted
    ? [...match.players].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    : match?.players ?? [];

  return (
    <div
      ref={boxRef}
      className={`relative z-10 rounded-md border bg-white text-sm shadow-sm ${
        match ? "border-gray-300" : "border-dashed border-gray-300"
      }`}
    >
      <p className="px-2 py-1 text-xs text-gray-400 border-b">
        {match?.isBye
          ? t("Bye")
          : table.isThirdPlace
          ? t("Third Place Match")
          : `${t("Table")} ${table.tableNo}`}
      </p>
      {!match && (
        <p className="px-2 py-3 text-xs text-gray-400 italic">
          {table.isThirdPlace
            ? t("Waiting for eliminated players")
            : t("Waiting for winners")}
        </p>
      )}
      {match && isEditable ? (
        <BracketScoreEditor match={match} players={players} names={names} />
      ) : (
        players.map((player) => {
          const tied =
            match?.isCompleted &&
            players.filter((p) => p.score === player.score).length > 1;
          const isChampion = isChampionTable && player.rank === 1;
          const isThird =
            table.isThirdPlace && match?.isCompleted && player.rank === 1;
          const advanced =
            isAdvancer(player.participantId) || isChampion || isThird;
          return (
            <div
              key={player.participantId}
              className={`flex items-center gap-2 px-2 py-1 border-b last:border-b-0 ${
                advanced ? "bg-green-50 font-medium" : ""
              } ${match?.isCompleted && !advanced ? "text-gray-400" : ""}`}
            >
              <span className="w-4 text-xs text-gray-400">
                {match?.isCompleted ? player.rank : ""}
              </span>
              <span className="flex-1 truncate">
                {names.get(player.participantId)}
              </span>
              {isChampion && <FaCrown className="text-amber-500" />}
              {isThird && <FaMedal className="text-amber-700" />}
              {tied && (
                <span className="text-[10px] rounded bg-amber-100 text-amber-700 px-1">
                  {t("Tie")}
                </span>
              )}
              <span className="w-8 text-right text-gray-500">
                {player.score ?? "-"}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
};

interface BracketScoreEditorProps {
  match: TournamentMatch;
  players: TournamentMatch["players"];
  names: Map<number, string>;
}

const BracketScoreEditor = ({
  match,
  players,
  names,
}: BracketScoreEditorProps) => {
  const { t } = useTranslation();
  const { scores, setScore, isFilled, save } = useScoreEntry(match);
  return (
    <div className="flex flex-col">
      {players.map((player) => (
        <div
          key={player.participantId}
          className="flex items-center gap-2 px-2 py-1 border-b"
        >
          <span className="w-4 text-xs text-gray-400">
            {match.isCompleted ? player.rank : ""}
          </span>
          <span className="flex-1 truncate">
            {names.get(player.participantId)}
            {player.wonTieBreak && (
              <span className="ml-1 text-[10px] rounded bg-amber-100 text-amber-700 px-1">
                {t("Chosen in tie")}
              </span>
            )}
          </span>
          <input
            type="number"
            className="w-14 border rounded px-1 py-0.5 text-right"
            placeholder={t("Score")}
            value={scores[player.participantId]}
            onChange={(e) => setScore(player.participantId, e.target.value)}
          />
        </div>
      ))}
      <div className="p-2 flex flex-col gap-2">
        <GenericButton
          size="sm"
          variant="primary"
          disabled={!isFilled}
          onClick={save}
        >
          {match.isCompleted ? t("Update Scores") : t("Save Scores")}
        </GenericButton>
        <TieBreakPicker match={match} names={names} />
      </div>
    </div>
  );
};

const EliminationBracket = ({
  tournament,
  matches,
  names,
  editableRound,
}: Props) => {
  const roundName = useEliminationRoundName();
  const containerRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef(new Map<string, HTMLDivElement>());
  const [paths, setPaths] = useState<string[]>([]);

  const elimination = matches.filter((m) => m.stage === MatchStage.ELIMINATION);
  const columns = buildColumns(tournament, elimination);
  const isFinished = tournament.status === TournamentStatus.FINISHED;

  // Kutular çizildikten sonra konumlarını ölçüp aralarına çizgi çeker
  useLayoutEffect(() => {
    const draw = () => {
      const container = containerRef.current;
      if (!container) return;
      const origin = container.getBoundingClientRect();
      const next: string[] = [];
      columns.slice(0, -1).forEach((column, c) => {
        column.tables.forEach((table, i) => {
          const from = boxRefs.current.get(table.key)?.getBoundingClientRect();
          if (!from) return;
          targetsOf(table, i, column, columns[c + 1]).forEach((key) => {
            const to = boxRefs.current.get(key)?.getBoundingClientRect();
            if (!to) return;
            const x1 = from.right - origin.left;
            const y1 = from.top + from.height / 2 - origin.top;
            const x2 = to.left - origin.left;
            const y2 = to.top + to.height / 2 - origin.top;
            const midX = (x1 + x2) / 2;
            next.push(`M${x1},${y1} H${midX} V${y2} H${x2}`);
          });
        });
      });
      setPaths(next);
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [matches, tournament]);

  if (!columns.length) return null;

  const isAdvancer = (participantId: number, c: number) =>
    columns[c + 1]?.tables.some(
      (next) =>
        !next.isThirdPlace &&
        next.match?.players.some((p) => p.participantId === participantId)
    );

  return (
    <div className="overflow-x-auto">
      <div ref={containerRef} className="relative inline-flex gap-16 p-2">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {paths.map((d) => (
            <path
              key={d}
              d={d}
              fill="none"
              className="stroke-gray-300"
              strokeWidth={2}
            />
          ))}
        </svg>
        {columns.map((column, c) => (
          <div key={column.round} className="flex flex-col w-60">
            <p className="text-xs font-semibold uppercase text-gray-500 mb-3 text-center">
              {roundName(column.round, columns.length)}
            </p>
            <div className="flex flex-col justify-around flex-1 gap-4">
              {column.tables.map((table) => (
                <BracketBox
                  key={table.key}
                  table={table}
                  names={names}
                  isEditable={
                    column.round === editableRound && !table.match?.isBye
                  }
                  isChampionTable={
                    c === columns.length - 1 &&
                    !!table.match &&
                    !table.isThirdPlace &&
                    isFinished
                  }
                  isAdvancer={(participantId) => isAdvancer(participantId, c)}
                  boxRef={(el) => {
                    if (el) boxRefs.current.set(table.key, el);
                    else boxRefs.current.delete(table.key);
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EliminationBracket;
